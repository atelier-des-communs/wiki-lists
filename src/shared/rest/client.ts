import {Promise} from "es6-promise";
import Axios from "axios";
import {Record} from "../model/instances";
import {ADD_ITEM_URL, DELETE_ITEM_URL, UPDATE_ITEM_URL, UPDATE_SCHEMA_URL} from "./api";
import {StructType} from "../model/types";

let axios = Axios.create();


/** Return the full item with new _id */
export function createItem(dbName: string, item : Record) : Promise<Record> {
    return axios.post(
        ADD_ITEM_URL.replace(":db_name", dbName),
        item)
        .then(response => response.data);
}

/** Return the image of the update item, as saved in DB */
export function updateItem(dbName: string, item : Record) : Promise<Record> {
    return axios.post(
        UPDATE_ITEM_URL.replace(":db_name", dbName),
        item)
        .then(response => response.data);
}

/** Return the image of the update item, as saved in DB */
export function updateSchema(dbName: string, schema:StructType) : Promise<StructType> {
    return axios.post(
        UPDATE_SCHEMA_URL.replace(":db_name", dbName),
        schema)
        .then(response => response.data);
}

/** Return the image of the update item, as saved in DB */
export function deleteItem(dbName: string, id : string) : Promise<boolean> {
    return axios.post(
        DELETE_ITEM_URL
            .replace(":db_name", dbName)
            .replace(":id", id))
        .then(response => response.data);
}



