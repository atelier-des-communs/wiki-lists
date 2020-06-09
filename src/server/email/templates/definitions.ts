import {ReactElement} from "react";

export interface Email {
    subject : string;
    html: ReactElement<any>;
}

export interface EmailTemplates {
    loginEmail(link:string) : Email;
    inviteEmail(link:string, dbName:string) : Email;
}
