// HTML
import {IState} from "./redux/index";
import {AccessRight} from "./access";
import {Record} from "./model/instances";
import {DbDefinition} from "../server/db/db";

export const CREATE_DB_PATH = "/create-db";
export const RECORDS_PATH = "/db/:db_name";
export const SINGLE_RECORD_PATH = "/db/:db_name/:id";


export function cookieName(dbName:string) {
    return `_db_pass_${dbName}`;
}

export function recordsLink(dbName: string) {
    return RECORDS_PATH.replace(':db_name', dbName);
}

export function singleRecordLink(dbName: string, recordId:string) {
    return SINGLE_RECORD_PATH
        .replace(':db_name', dbName)
        .replace(":id", recordId);
}


// REST
export const ADD_ITEM_URL = "/api/:db_name/create";
export const UPDATE_ITEM_URL = "/api/:db_name/update/";
export const DELETE_ITEM_URL = "/api/:db_name/delete/:id";
export const GET_ITEM_URL = "/api/:db_name/item/:id";
export const GET_ITEMS_URL = "/api/:db_name/items/";
export const GET_DB_DEFINITION_URL = "/api/:db_name/definition";

export const CREATE_DB_URL = "/api/db/create/";
export const UPDATE_DB_URL = "/api/:db_name/update/";
export const UPDATE_SCHEMA_URL = "/api/:db_name/schema/update/";

export const DOWNLOAD_XLS_URL  = "/xls/:db_name";
export const DOWNLOAD_JSON_URL  = "/json/:db_name";

export const VALIDATION_STATUS_CODE = 444;

// Marshalled JSN within the page
export interface IMarshalledContext {
    state: IState,
    env:string,
    rights : AccessRight[]
}

// Generic reader interface, implemented directly with DB access for SSR, or as rest client for Browser
export interface DataFetcher {
    getRecord(dbName: string, id : string) : Promise<Record>;
    getRecords(dbName: string) : Promise<Record[]>;
    getDbDefinition(dbName:string) : Promise<DbDefinition>;
}