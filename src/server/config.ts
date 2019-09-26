
export default {
    SECRET : getEnv("SECRET"),
    DB_HOST : getEnv("DB_HOST", "localhost"),
    DB_NAME : getEnv("DB_NAME", "wikilist"),
    DB_PORT : getEnv("DB_PORT", "27017"),
    LANGS : getEnv("LANG", ""),
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