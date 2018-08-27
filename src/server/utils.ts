import * as Express from "express";
import {ValidationException} from "../shared/validators/validators";
import {VALIDATION_STATUS_CODE} from "../shared/rest/api";
import {AccessRight} from "../shared/access";
import {getDbDefinition} from "./db/db";
import {isIn} from "../shared/utils";

// Handy function returing 200 and the payload result of the promise of returning 500 on error
export function returnPromise(res: Express.Response, promise: Promise<{}>) {
    promise.then(
        content => {
            res.status(200).send(content)
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

export function splitDbName(dbStr:string) {
    return dbStr.split("@");
}

export async function getAccessRights(dbStr: string, pass:string) {
    let dbDef = await getDbDefinition(dbStr);
    if (pass) {
        if (pass==dbDef.secret) {
            return [AccessRight.DELETE, AccessRight.EDIT, AccessRight.ADMIN, AccessRight.VIEW];
        } else {
            // FIXME: return nice 403, localized page
            throw new HttpError(403, "Bad password");
        }
    } else {
        return [AccessRight.EDIT, AccessRight.VIEW];
    }
}

export async function requiresRight(dbName:string, pass:string, right : AccessRight) {
    let rights = await getAccessRights(dbName, pass);
    if (isIn(rights, right)) {
        return true;
    } else {
        throw new HttpError(403, "Forbidden");
    }

}