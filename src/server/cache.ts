import * as redis from "redis";
import lru from "redis-lru";
import {toAnnotatedJson, toTypedObjects} from "../shared/serializer";
import * as md5 from "md5";
import {config} from "./config";
import {isPromise, parseBool} from "../shared/utils";
import stringify from 'json-stringify-deterministic';

const NB_CACHE_ITEMS = config.NB_CACHE_ITEMS;
const client = redis.createClient();
const lruCache = lru(client, NB_CACHE_ITEMS);

const MAX_AGE = 1000 * 3600 * 24;

const useCache = parseBool(config.CACHE);

console.log("Caching activated :", useCache);


export function getCache<T>(key:string, func:()=>T | Promise<T>) : Promise<T> {
    if (!useCache) {
        // Synchronous resolution, no cache
        return Promise.resolve(func());
    }

    let annotatedFunc = () =>  {
        let res = func();
        if (isPromise(res)) {
            return (res as Promise<T>).then(res => toAnnotatedJson(res))
        } else {
            return toAnnotatedJson(res);
        }
    };

    return lruCache.getOrSet(key, annotatedFunc, MAX_AGE).catch((err)=> {
        console.error("Error happened while caching", err);
        throw err;
    }).then((res) => toTypedObjects(res));
}

// cache decorator
export function cache(
    target: Object,
    methodName: string,
    propertyDesciptor: PropertyDescriptor): PropertyDescriptor {

    const method = propertyDesciptor.value;

    propertyDesciptor.value = function (...args: any[]) {

        // Build cache key with full arguments
        const params = args.map(a => stringify(a)).join();
        const dbName = args[0];
        const otherParams = stringify(params.slice(1));
        const key = dbName + ":" + methodName + ": " + md5(otherParams);

        // Get from cache or call method
        return getCache(key, () => {
            console.debug("Key not hit, processing function :", key);
            return method.apply(this, args);
        });
    };
    return propertyDesciptor;
}

export function clearRedisCache() {
    lruCache.reset();
}
