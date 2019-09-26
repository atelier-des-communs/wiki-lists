import * as redis from "redis";
import lru from "redis-lru";
import {toAnnotatedJson, toTypedObjects} from "../shared/serializer";
import * as md5 from "md5";

const NB_CACHE_ITEMS = 10000;
const client = redis.createClient();
const lruCache = lru(client, NB_CACHE_ITEMS);

const MAX_AGE = 1000 * 3600 * 24;

export function getCache<T>(key:string, func:()=>T) : Promise<T> {
    return lruCache.getOrSet(key, func, MAX_AGE).catch((err)=> {
        console.error("Error happened while caching", err);
        return func();
    });
}

// cache decorator
export function cache(
    target: Object,
    methodName: string,
    propertyDesciptor: PropertyDescriptor): PropertyDescriptor {

    const method = propertyDesciptor.value;

    propertyDesciptor.value = function (...args: any[]) {

        // Build cache key with full arguments
        const params = args.map(a => JSON.stringify(a)).join();
        const dbName = args[0]
        const otherParams = JSON.stringify(params.slice(1))
        const key = dbName + ":" + methodName + ": " + md5(otherParams);

        // Get from cache or call method
        return getCache(key, () => {

            console.debug("Key not hit, processing function :", key);

            let promise : Promise<any> = method.apply(this, args);

            // Plain json with type info, ready to be serialized
            return promise.then((res) => {
                return toAnnotatedJson(res)
            })

        }).then((res) => {

            // Unserialize JSON
            return toTypedObjects(res);

        });
    };
    return propertyDesciptor;
}
