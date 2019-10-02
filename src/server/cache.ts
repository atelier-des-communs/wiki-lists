import * as redis from "redis";
import lru from "redis-lru";
import {toAnnotatedJson, toTypedObjects} from "../shared/serializer";
import * as md5 from "md5";
import {config} from "./config";
import {parseBool} from "../shared/utils";
import stringify from 'json-stringify-deterministic';

const NB_CACHE_ITEMS = 10000;
const client = redis.createClient();
const lruCache = lru(client, NB_CACHE_ITEMS);

const MAX_AGE = 1000 * 3600 * 24;

const useCache = parseBool(config.CACHE);

console.log("Caching activated :", useCache);


export function getCache<T>(key:string, func:()=>T) : Promise<T> {
    if (!useCache) {
        return Promise.resolve(func());
    }
    return lruCache.getOrSet(key, func, MAX_AGE).catch((err)=> {
        console.error("Error happened while caching", err);
        return toAnnotatedJson(func());
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
        const dbName = args[0]
        const otherParams = stringify(params.slice(1))
        const key = dbName + ":" + methodName + ": " + md5(otherParams);

        // Get from cache or call method
        return getCache(key, () => {
            console.debug("Key not hit, processing function :", key);
            return method.apply(this, args);
        });
    };
    return propertyDesciptor;
}
