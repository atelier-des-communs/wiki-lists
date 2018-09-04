import {
    ADD_ITEM_URL,
    cookieName,
    DELETE_ITEM_URL, GET_DB_DEFINITION_URL,
    GET_ITEM_URL, GET_ITEMS_URL,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL
} from "../shared/api";
import {createRecordDb, dbDataFetcher, deleteRecordDb, updateRecordDb, updateSchemaDb} from "./db/db";
import {Record} from "../shared/model/instances";
import {HttpError, requiresRight, returnPromise, traverse} from "./utils";
import {Express} from "express";
import {StructType} from "../shared/model/types";
import {Request, Response} from "express-serve-static-core"
import {AccessRight} from "../shared/access";
import * as xss from "xss";

async function addItemAsync(req:Request) : Promise<Record> {
    let record = sanitizeJson(req.body) as Record;
    await requiresRight(req, AccessRight.EDIT);
    return createRecordDb(req.params.db_name, record);
}

async function updateItemAsync(req:Request) : Promise<Record>{
    let record = sanitizeJson(req.body) as Record;
    await requiresRight(req, AccessRight.EDIT);
    return updateRecordDb(req.params.db_name, record);
}

async function deleteItemAsync(req:Request) : Promise<boolean>{
    let id = req.params.id;
    await requiresRight(req, AccessRight.DELETE);
    return deleteRecordDb(req.params.db_name, id);
}

async function updateSchemaAsync(req:Request) : Promise<StructType>{
    let schema = sanitizeJson(req.body) as StructType;
    await requiresRight(req, AccessRight.ADMIN);
    return updateSchemaDb(req.params.db_name, schema);
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

    server.get(GET_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, dbDataFetcher.getRecord(req.params.db_name, req.params.id));
    });

    server.get(GET_ITEMS_URL, function (req: Request, res: Response) {
        returnPromise(res, dbDataFetcher.getRecords(req.params.db_name));
    });

    server.get(GET_DB_DEFINITION_URL, function (req: Request, res: Response) {
        returnPromise(res, dbDataFetcher.getDbDefinition(req.params.db_name));
    });
}

// Recursively sanitize JSON
// FIXME put is as a Express plugin, for automatic sanitizing
function sanitizeJson(input:any) {
    let xssFunc = (obj: any, prop: string, value: any) : any => {
        if (typeof(value) == "string") {
            obj[prop] = xss(value);
        }
    }
    traverse(input, xssFunc);
    return input;
}