import {IMessages, Language} from "../../shared/i18n/messages";
import {messages as frMessages} from "./fr-FR";
import {messages as enMessages} from "./en-GB";
import {Request} from "express-serve-static-core"

interface LanguageWithMessages extends Language {
    messages:IMessages;
}

export const supportedLanguages : LanguageWithMessages[] = [
    {key: "en-GB", flag: "united kingdom", messages:enMessages},
    {key: "fr-FR", flag: "france", messages:frMessages}];


export function selectLanguage(req: Request) : LanguageWithMessages {
    let key = (req as any).language;
    return supportedLanguages.filter(lang => lang.key == key)[0];
}