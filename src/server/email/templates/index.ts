import {EmailTemplates} from "./definitions";
import {emailsFr} from "./fr-FR";
import {Map} from "../../../shared/utils";
import {emailsEn} from "./en-GB";

export const emailTemplates : Map<EmailTemplates> = {
    "fr-FR" : emailsFr,
    "en-GB" : emailsEn,
};