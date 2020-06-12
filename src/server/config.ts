import {SharedConfig} from "../shared/api";
import {parseBool} from "../shared/utils";

export const config = {
    SITE_NAME: getEnv("SITE_NAME", "Wiki Lists"),
    SECRET : getEnv("SECRET"),
    CACHE : getEnv("CACHE", "true"),

    PORT : parseInt(getEnv("PORT", 8082)),
    ROOT_URL : getEnv("ROOT_URL", "http://localhost:8082/").replace(/\/$/, ""),

    DB_HOST : getEnv("DB_HOST", "localhost"),
    DB_NAME : getEnv("DB_NAME", "wikilist"),
    DB_PORT : parseInt(getEnv("DB_PORT", "27017")),

    REDIS_PORT : parseInt(getEnv("REDIS_PORT", 6379)),

    LANGS : getEnv("LANGS", ""),
    SERVE_STATIC : getEnv("SERVE_STATIC", 1),
    SINGLE_BASE : getEnv("SINGLE_BASE", ""),
    CAPTCHA_KEY : getEnv("CAPTCHA_KEY", ""),
    CAPTCHA_SECRET : getEnv("CAPTCHA_SECRET", ""),
    NB_CACHE_ITEMS : parseInt(getEnv("NB_CACHE_ITEMS", 100000)),

    MAIL_FROM : getEnv("MAIL_FROM"),

    // SMTP Config
    SMTP_HOST : getEnv("SMTP_HOST", ""),
    SMTP_PORT : parseInt(getEnv("SMTP_PORT", "25")),
    SMTP_SECURE : parseBool(getEnv("SMTP_SECURE", "false")),
    SMTP_LOGIN : getEnv("SMTP_LOGIN", ""),
    SMTP_PASS : getEnv("SMTP_PASS", ""),

    // Or mailgun
    MAILGUN_API : getEnv("MAILGUN_API", ""),
    MAILGUN_DOMAIN : getEnv("MAILGUN_DOMAIN", ""),
};


// Config shared with client (via serialization)
export const sharedConfig : SharedConfig = {
    singleDb : config.SINGLE_BASE,
    captcha_key : config.CAPTCHA_KEY
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