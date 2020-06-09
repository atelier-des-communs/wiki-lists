import * as Express from "express";
import {VALIDATION_ERROR_STATUS_CODE} from "../shared/api";
import {AccessRight, hasDbRight, hasRecordRight} from "../shared/access";
import {DbDataFetcher, getDbDef} from "./db/db";
import {Request} from "express-serve-static-core"
import {HttpError} from "../shared/errors";
import {Record} from "../shared/model/instances";

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
export function returnPromiseWithCode(res: Express.Response, promise: Promise<ContentWithStatus>) {
    promise.then(
        result => {
            res.status(result.statusCode).send(result.content)
        }).
    catch(
        error => {
            console.error("Error occured in promise : ", error);
            if (error.validationErrors) {
                // Send list of errors back to client, with custom error codes
                res.status(VALIDATION_ERROR_STATUS_CODE).send(error.validationErrors);
            } else if (error.code) {
                res.status(error.code).send(error.message);
            } else {
                res.status(501).send(error);
            }
        });
}

export async function requiresRecordRight(req:Request, record: Record, right : AccessRight) {
    let dbDef = await getDbDef(req.params.db_name);
    let dbDataFetcher = new DbDataFetcher(req);
    if (hasRecordRight(dbDef, req.session.user, record, right)) {
        return true;
    } else {
        throw new HttpError(403, "Forbidden");
    }
}

export async function requiresDbRight(req:Request, right : AccessRight) {
    let dbDef = await getDbDef(req.params.db_name);
    if (hasDbRight(dbDef, req.session.user, right)) {
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

