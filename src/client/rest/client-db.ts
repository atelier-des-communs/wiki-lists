import Axios, {AxiosPromise} from "axios";
import {Record} from "../../shared/model/instances";
import {
    ADD_ITEM_URL,
    CHECK_DB_NAME,
    CREATE_DB_URL,
    DataFetcher,
    DELETE_ITEM_URL,
    GET_DB_DEFINITION_URL,
    GET_ITEM_URL,
    GET_ITEMS_URL,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL,
    SEND_CONNECT_LINK, LIST_DEFINITIONS_URL, UPDATE_EMAILS_URL
} from "../../shared/api";
import * as QueryString from "querystring";
import {StructType} from "../../shared/model/types";
import {ValidationErrors} from "../../shared/validators/validators";
import {DbDefinition} from "../../shared/model/db-def";
import {empty} from "../../shared/utils";
import {post, get, del} from "./common";

/** Return the full item with new _id */
export async function createItem(dbName: string, item : Record) : Promise<Record> {
    return await post(
        ADD_ITEM_URL.replace(":db_name", dbName),
        item);
}

export async function sendConnectionLink(email:string) : Promise<{}> {
    return await post(SEND_CONNECT_LINK + "?" + QueryString.stringify({email}));
}

/** Return the image of the update item, as saved in DB */
export async function updateItem(dbName: string, item : Record) : Promise<Record> {
    return await post(
        UPDATE_ITEM_URL.replace(":db_name", dbName),
        item);
}

export async function updateEmails(dbName: string, emails : string []) : Promise<Record> {
    return await post(
        UPDATE_EMAILS_URL.replace(":db_name", dbName),
        emails);
}

/** Return the image of the update item, as saved in DB */
export async function updateSchema(dbName: string, schema:StructType) : Promise<StructType> {
    return await post<StructType>(
        UPDATE_SCHEMA_URL.replace(":db_name", dbName),
        schema);
}

/** Return the image of the update item, as saved in DB */
export async function createDb(dbDef:DbDefinition) : Promise<boolean> {
    return await post<boolean>(CREATE_DB_URL, dbDef);
}

/** Return the image of the update item, as saved in DB */
export async function deleteItem(dbName: string, id : string) : Promise<boolean> {
    return await del<boolean>(DELETE_ITEM_URL
            .replace(":db_name", dbName)
            .replace(":id", id));
}

export async function checkAvailability(dbName: string) : Promise<boolean> {
    if (empty(dbName)) return true;
    return await get<boolean>(
        CHECK_DB_NAME.replace(":db_name", dbName));
}

export let restDataFetcher : DataFetcher = {

    async getDbDefinition(dbName:string) : Promise<DbDefinition>{
        return await get<DbDefinition>(
                GET_DB_DEFINITION_URL
                    .replace(":db_name", dbName));
    },

    async listDbDefinitions() : Promise<DbDefinition[]> {
        return await get<DbDefinition[]>(LIST_DEFINITIONS_URL);
    },

    async getRecord(dbName:string, id:string) : Promise<Record> {
        return await get(GET_ITEM_URL
                .replace(":db_name", dbName)
                .replace(":id", id));
    },

    async getRecords(dbName:string) : Promise<Record[]> {
        return await get<Record[]>(GET_ITEMS_URL
                .replace(":db_name", dbName));
    }


};







