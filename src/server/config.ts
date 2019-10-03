import {SharedConfig} from "../shared/api";

export const config = {
    SECRET : getEnv("SECRET"),
    CACHE : getEnv("CACHE", "true"),
    ROOT_URL : getEnv("ROOT_URL", "http://localhost"),
    DB_HOST : getEnv("DB_HOST", "localhost"),
    DB_NAME : getEnv("DB_NAME", "wikilist"),
    DB_PORT : getEnv("DB_PORT", "27017"),
    LANGS : getEnv("LANGS", ""),
    SINGLE_BASE : getEnv("SINGLE_BASE", ""),
};


// Config shared with client (via serialization)
export const sharedConfig : SharedConfig = {
    singleDb : config.SINGLE_BASE
};

function getEnv(key:string, def:any = null) {
    if (process.env.hasOwnProperty(key)) {
        return process.env[key]
    } else {
        if (def == null) {
            throw new Error(`Missing env ${key}`)
        } else {
            return def;
        }
    }
}