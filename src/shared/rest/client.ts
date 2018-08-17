import {Promise} from "es6-promise";
import {Map} from "../utils";
import Axios from "axios";
import {Record} from "../model/instances";
import {ADD_ITEM_URL, DELETE_ITEM_URL, UPDATE_ITEM_URL, UPDATE_SCHEMA_URL} from "./api";
import {StructType} from "../model/types";

let axios = Axios.create();


/** Return the full item with new _id */
export function createItem(item : Record) : Promise<Record> {
    return axios.post(ADD_ITEM_URL, item).
        then(response => response.data);
}

/** Return the image of the update item, as saved in DB */
export function updateItem(item : Record) : Promise<Record> {
    return axios.post(UPDATE_ITEM_URL, item).
    then(response => response.data);
}

/** Return the image of the update item, as saved in DB */
export function updateSchema(schema:StructType) : Promise<StructType> {
    return axios.post(UPDATE_SCHEMA_URL, schema).
    then(response => response.data);
}

/** Return the image of the update item, as saved in DB */
export function deleteItem(id : string) : Promise<boolean> {
    return axios.post(DELETE_ITEM_URL.replace(":id", id)).
    then(response => response.data);
}



