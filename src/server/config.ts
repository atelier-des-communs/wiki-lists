import {parseBool} from "../shared/utils";

export default {
    SITE_NAME :  getEnv("SITE_NAME","Wiki-list"),
    BASE_URL : getEnv("BASE_URL"),
    SECRET : getEnv("SECRET"),

    SMTP_HOST : getEnv("SMTP_HOST"),
    SMTP_PORT : parseInt(getEnv("SMTP_PORT")),
    SMTP_SECURE : parseBool(getEnv("SMTP_SECURE", "false")),
    SMTP_LOGIN : getEnv("SMTP_LOGIN"),
    SMTP_PASS : getEnv("SMTP_PASS"),
    SMTP_FROM : getEnv("SMTP_FROM"),
    SMTP_REJECT_UNAUTHORIZED : parseBool(getEnv("SMTP_REJECT_UNAUTHORIZED", "true")),

    DB_HOST : getEnv("DB_HOST", "localhost"),
    DB_NAME : getEnv("DB_NAME", "wikilist"),
    DB_PORT : getEnv("DB_PORT", "27017")
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