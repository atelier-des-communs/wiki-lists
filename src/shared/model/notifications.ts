import {Map} from "../utils";

export interface Notification {
    email:string,
    items:string[],
    sent?:boolean,
}

export interface Subscription {
    email: string,
    filters: Map<string>,
    disabled?:boolean
}



