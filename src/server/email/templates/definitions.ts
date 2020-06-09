import {ReactElement} from "react";
import {Map} from "../../../shared/utils";

export const LIST_UNSUBSCRIBE = "List-Unsubscribe";

export interface Email {
    subject : string;
    html: ReactElement<any>;
    headers ?: Map<string>
}

export interface EmailTemplates {
    loginEmail(link:string) : Email;
    newSubscription(email:string,commune:string, manageURL:string) : Email;
}


