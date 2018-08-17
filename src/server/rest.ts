import {ADD_ITEM_URL, DELETE_ITEM_URL, UPDATE_ITEM_URL, UPDATE_SCHEMA_URL} from "../shared/rest/api";
import {MY_DB_NAME} from "./html";
import {createRecord, deleteRecord, updateRecord, updateSchema} from "./db/db";
import {Record} from "../shared/model/instances";
import {returnPromise} from "./utils";
import {Express} from "express";
import {StructType} from "../shared/model/types";

export function setUp(server:Express) {

    server.post(ADD_ITEM_URL, function (req, res) {
        let record = req.body as Record;
        let recordWithId = createRecord(MY_DB_NAME, record);
        returnPromise(res, recordWithId);
    });

    server.post(UPDATE_ITEM_URL, function (req, res) {
        // Echo
        let record = req.body as Record;
        let updatedRecord = updateRecord(MY_DB_NAME, record);
        returnPromise(res, updatedRecord);
    });

    server.post(DELETE_ITEM_URL, function (req, res) {
        let id = req.params.id;
        let updatedRecord = deleteRecord(MY_DB_NAME, id);
        returnPromise(res, updatedRecord);
    });

    server.post(UPDATE_SCHEMA_URL, function (req, res) {
        let dbName = req.params.db_name;
        let schema = req.body as StructType;
        let updatedRecord = updateSchema(MY_DB_NAME, schema);
        returnPromise(res, updatedRecord);
    });
}