
import {IState} from "./redux/index";
import {Record} from "./model/instances";
import {DbDefinition} from "./model/db-def";
import {IMessages, Language} from "./i18n/messages";
import {IUser} from "./model/user";
import {get} from "../client/rest/common";


// HTML
export const BASE_DB_PATH = "/db/";
export const CREATE_DB_PATH = "/create-db";
export const RECORDS_PATH = BASE_DB_PATH + ":db_name";
export const ADMIN_PATH = RECORDS_PATH + "/admin";
export const RECORDS_ADMIN_PATH = RECORDS_PATH + "@:db_pass";
export const SINGLE_RECORD_PATH = BASE_DB_PATH + ":db_name/:id";
export const LOGIN_PAGE_PATH = "/login";
export const PROFILE_PAGE_PATH = "/profile";

// Cookies
export const COOKIE_DURATION = 31 * 24 * 3600 * 1000 // one month;

export const COOKIE_PREFIX = "wl_";
export const LANG_COOKIE = COOKIE_PREFIX + "lang";

export function recordsLink(dbName: string) {
    return RECORDS_PATH.replace(':db_name', dbName);
}

export function singleRecordLink(dbName: string, recordId:string) {
    return SINGLE_RECORD_PATH
        .replace(':db_name', dbName)
        .replace(":id", recordId);
}


// REST
export const API_BASE_URL = "/api";
export const ADD_ITEM_URL = "/api/:db_name/create";
export const UPDATE_ITEM_URL = "/api/:db_name/update/";
export const DELETE_ITEM_URL = "/api/:db_name/delete/:id";
export const GET_ITEM_URL = "/api/:db_name/item/:id";
export const GET_ITEMS_URL = "/api/:db_name/items/";
export const GET_DB_DEFINITION_URL = "/api/:db_name/definition";
export const LIST_DEFINITIONS_URL = "/api/list-dbs";

// Auth
export const LOGIN_URL = "/auth/login/:token";
export const SEND_CONNECT_LINK = "/auth/send_connection";
export const LOGOUT_URL = "/auth/logout";

// Rest
export const CREATE_DB_URL = "/api/create-db/";
export const CHECK_DB_NAME = "/api/check-db/:db_name";
export const UPDATE_EMAILS_URL = "/api/emails/:db_name";
export const UPDATE_SCHEMA_URL = "/api/update-schema/:db_name";


export const DOWNLOAD_XLS_URL  = "/xls/:db_name";
export const DOWNLOAD_JSON_URL  = "/json/:db_name";

export const VALIDATION_ERROR_STATUS_CODE = 444;

export interface SharedConfig {
    site_name: String,
}

// Marshalled JSN within the page
export interface IMarshalledContext {
    state: IState,
    env:string,
    config: SharedConfig,
    lang:string,
    user:IUser,
    supportedLanguages: Language[]}

// Generic reader interface, implemented directly with DB access for SSR, or as rest client for Browser
export interface DataFetcher {
    getRecord(dbName: string, id : string, user:IUser, messages:IMessages) : Promise<Record>;
    getRecords(dbName: string, user:IUser, messages:IMessages) : Promise<Record[]>;
    getDbDefinition(dbName: string, user:IUser, messages:IMessages) : Promise<DbDefinition>;
    listDbDefinitions(user:IUser) : Promise<DbDefinition[]>;
}