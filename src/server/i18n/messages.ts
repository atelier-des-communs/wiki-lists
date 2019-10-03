import {IMessages, Language} from "../../shared/i18n/messages";
import {messages as frMessages} from "./fr-FR";
import {messages as enMessages} from "./en-GB";
import {Request} from "express-serve-static-core"
import {config} from "../config";

interface LanguageWithMessages extends Language {
    messages:IMessages;
}

let languages : LanguageWithMessages[] = [
    {key: "en-GB", flag: "united kingdom", messages:enMessages},
    {key: "fr-FR", flag: "france", messages:frMessages}];

if (config.LANGS) {

    let langs = config.LANGS.split(",");
    languages = languages.filter(lang => langs.indexOf(lang.key) > -1);
    console.info("LANGS", langs, "filtered :", languages.length)
}

export function selectLanguage(req: Request) : LanguageWithMessages {
    let key = (req as any).language;
    return languages.filter(lang => lang.key == key)[0];
}

export const LANGUAGES = languages;