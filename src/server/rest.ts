import {ADD_ITEM_URL, DELETE_ITEM_URL, UPDATE_ITEM_URL, UPDATE_SCHEMA_URL} from "../shared/rest/api";
import {createRecordDb, deleteRecordDb, getDbDefinition, updateRecordDb, updateSchemaDb} from "./db/db";
import {Record} from "../shared/model/instances";
import {HttpError, requiresRight, returnPromise, splitDbName, traverse} from "./utils";
import {Express} from "express";
import {StructType} from "../shared/model/types";
import {Request, Response} from "express-serve-static-core"
import {AccessRight} from "../shared/access";
import * as xss from "xss";



async function addItemAsync(req:Request) : Promise<Record>{
    let [db_name, pass] = splitDbName(req.params.db_name);
    let record = sanitizeJson(req.body) as Record;
    await requiresRight(db_name, pass, AccessRight.EDIT);
    return createRecordDb(db_name, record);
}

async function updateItemAsync(req:Request) : Promise<Record>{
    let [db_name, pass] = splitDbName(req.params.db_name);
    let record = sanitizeJson(req.body) as Record;
    await requiresRight(db_name, pass, AccessRight.EDIT);
    return updateRecordDb(db_name, record);
}

async function deleteItemAsync(req:Request) : Promise<boolean>{
    let [db_name, pass] = splitDbName(req.params.db_name);
    let id = req.params.id;
    await requiresRight(db_name, pass, AccessRight.DELETE);
    return deleteRecordDb(db_name, id);
}

async function updateSchemaAsync(req:Request) : Promise<StructType>{
    let [db_name, pass] = splitDbName(req.params.db_name);
    let schema = sanitizeJson(req.body) as StructType;
    await requiresRight(db_name, pass, AccessRight.ADMIN);
    return updateSchemaDb(db_name, schema);
}

export function setUp(server:Express) {

    server.post(ADD_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, addItemAsync(req));
    });

    server.post(UPDATE_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, updateItemAsync(req));
    });

    server.post(DELETE_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, deleteItemAsync(req));
    });

    server.post(UPDATE_SCHEMA_URL, function (req: Request, res: Response) {
        returnPromise(res, updateSchemaAsync(req));
    });
}

// Recursively sanitize JSON
function sanitizeJson(input:any) {
    let xssFunc = (obj: any, prop: string, value: any) : any => {
        if (typeof(value) == "string") {
            obj[prop] = xss(value);
        }
    }
    traverse(input, xssFunc);
    return input;
}