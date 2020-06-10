import {ReactElement} from "react";
import {Map} from "../../../shared/utils";
import {Record} from "../../../shared/model/instances";
import {DbDefinition} from "../../../shared/model/db-def";
import {Filter} from "../../../shared/views/filters";

export const LIST_UNSUBSCRIBE = "List-Unsubscribe";

export interface Email {
    subject : string;
    html: ReactElement<any>;
    headers ?: Map<string>
}

export interface SimpleRecord {
    name:string,
    link:string,
    surface:number,
    type:string,
    addresse:string,
}

export interface EmailTemplates {
    loginEmail(link:string) : Email;
    newSubscription(commune:string, manageURL:string) : Email;
    notification(commune:string, records:SimpleRecord[], manageURl:string, allURL:string) : Email;
}


