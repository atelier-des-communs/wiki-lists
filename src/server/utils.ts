import * as Express from "express";
import {dbPassCookieName, VALIDATION_STATUS_CODE} from "../shared/api";
import {AccessRight} from "../shared/access";
import {getDbSecret} from "./db/db";
import {isIn} from "../shared/utils";
import {Request} from "express-serve-static-core"
import {DefaultMessages} from "../shared/i18n/messages";
import {frMessages} from "../shared/i18n/fr";

// Handy function returing 200 and the payload result of the promise of returning 500 on error
export function returnPromise(res: Express.Response, promise: Promise<{}>, code:number=200) {
    promise.then(
        content => {
            res.status(code).send(content)
        }).
    catch(
        error => {
            console.log("Error occured", error);
            if (error.validationErrors) {
                // Send list of errors back to client, with custom error codes
                res.status(VALIDATION_STATUS_CODE).send(error.validationErrors);
            } else if (error.code) {
                res.status(error.code).send(error.message);
            } else {
                res.status(500).send(error);
            }
        });
}

export class HttpError {
    code : number;
    message: string;

    constructor(code:number, message:string) {
        this.code = code;
        this.message = message;
    }
}

export async function getAccessRights(dbStr: string, pass:string) {
    let secret = await getDbSecret(dbStr);
    if (pass) {
        if (pass==secret) {
            return [AccessRight.DELETE, AccessRight.EDIT, AccessRight.ADMIN, AccessRight.VIEW];
        } else {
            // FIXME: return nice 403, localized page
            throw new HttpError(403, "Bad password");
        }
    } else {
        return [AccessRight.EDIT, AccessRight.VIEW];
    }
}

export async function requiresRight(req:Request, right : AccessRight) {

    let rights = await getAccessRights(
        req.params.db_name,
        req.cookies[dbPassCookieName(req.params.db_name)]);
    if (isIn(rights, right)) {
        return true;
    } else {
        throw new HttpError(403, "Forbidden");
    }

}

// Resursively applies a function on a JSON tree
export function traverse(o: any, fn: (obj: any, prop: string, value: any) => void) {
    for (const i in o) {
        fn.apply(this, [o, i, o[i]]);
        if (o[i] !== null && typeof(o[i]) === 'object') {
            traverse(o[i], fn);
        }
    }
}
