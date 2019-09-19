import * as Express from "express";
import {SECRET_COOKIE, VALIDATION_ERROR_STATUS_CODE} from "../shared/api";
import {AccessRight} from "../shared/access";
import {getDbDef} from "./db/db";
import {isIn} from "../shared/utils";
import {Request} from "express-serve-static-core"
import {toAnnotatedJson} from "../shared/serializer";
import {BadRequestException} from "../shared/validators/validators";

export interface ContentWithStatus {
    statusCode:number,
    content:any
}

// Same as #returnPromiseWithCode, code being known in advance
export function returnPromise(res: Express.Response, promise: Promise<{}>, code=200) {
    returnPromiseWithCode(res, promise.then(content => ({content, statusCode:code})));
}

// Handy function returing 200 and the payload result of the promise, or returning 500 on error
// It wraps the Promise API around Express API
export async function returnPromiseWithCode(res: Express.Response, promise: Promise<ContentWithStatus>) {
    try {
        let result = await promise;
        console.info("status", result.statusCode, "content", result.content);
        res.status(result.statusCode).send(result.content);
    } catch (error) {
        console.error("Error occured in promise : ", error);
        if (error instanceof BadRequestException) {
            res.status(400).send(error.error)
        } else  if (error.validationErrors) {
            // Send list of errors back to client, with custom error codes
            res.status(VALIDATION_ERROR_STATUS_CODE).send(error.validationErrors);
        } else if (error.code) {
            res.status(error.code).send(error.message);
        } else {
            res.status(501).send(error);
        }
    }
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
    let dbDef = await getDbDef(dbStr);
    if (pass) {
        if (pass==dbDef.secret) {
            return [AccessRight.DELETE, AccessRight.EDIT, AccessRight.ADMIN, AccessRight.VIEW];
        } else {
            // FIXME: return nice 403, localized page
            throw new HttpError(403, "Bad password");
        }
    } else {
        // FIXME default rights defined in the DB
        if (dbDef.anonRights) {
            return dbDef.anonRights;
        } else {
            // Default anonymous user access : wiki
            return [AccessRight.EDIT, AccessRight.VIEW];
        }
    }
}

export async function requiresRight(req:Request, right : AccessRight) {

    let rights = await getAccessRights(
        req.params.db_name,
        req.cookies[SECRET_COOKIE(req.params.db_name)]);
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

