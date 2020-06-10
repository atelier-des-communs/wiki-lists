import {config} from "../../server/config";
import {clearRedisCache} from "../../server/cache";
import {clearCacheCollections} from "../../server/db/db";

export async function clear_caches() {
    let dbName = config.SINGLE_BASE;
    await clearRedisCache();
    await clearCacheCollections(dbName);
}