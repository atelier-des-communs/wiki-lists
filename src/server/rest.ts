import {ADD_ITEM_URL, DELETE_ITEM_URL, UPDATE_ITEM_URL, UPDATE_SCHEMA_URL} from "../shared/rest/api";
import {createRecordDb, deleteRecordDb, updateRecordDb, updateSchemaDb} from "./db/db";
import {Record} from "../shared/model/instances";
import {returnPromise} from "./utils";
import {Express} from "express";
import {StructType} from "../shared/model/types";
import {Request, Response} from "express-serve-static-core"

export function setUp(server:Express) {

    server.post(ADD_ITEM_URL, function (req: Request, res: Response) {
        let record = req.body as Record;
        let recordWithId = createRecordDb(req.params.db_name, record);
        returnPromise(res, recordWithId);
    });

    server.post(UPDATE_ITEM_URL, function (req: Request, res: Response) {
        // Echo
        let record = req.body as Record;
        let updatedRecord = updateRecordDb(req.params.db_name, record);
        returnPromise(res, updatedRecord);
    });

    server.post(DELETE_ITEM_URL, function (req: Request, res: Response) {
        let id = req.params.id;
        let updatedRecord = deleteRecordDb(req.params.db_name, id);
        returnPromise(res, updatedRecord);
    });

    server.post(UPDATE_SCHEMA_URL, function (req: Request, res: Response) {
        let dbName = req.params.db_name;
        let schema = req.body as StructType;
        let updatedRecord = updateSchemaDb(req.params.db_name, schema);
        returnPromise(res, updatedRecord);
    });
}