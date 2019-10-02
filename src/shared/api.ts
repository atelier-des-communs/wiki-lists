
import {IState} from "./redux/index";
import {Record} from "./model/instances";
import {DbDefinition} from "./model/db-def";
import {Language} from "./i18n/messages";
import {Map} from "./utils";
import {Filter} from "./views/filters";
import {ISort} from "./views/sort";
import {Cluster} from "./model/geo";


// HTML
export const CREATE_DB_PATH = "/create-db";
export const RECORDS_PATH = (config : SharedConfig) =>  config.singleDb ? "/" : "/db/:db_name";
export const RECORDS_ADMIN_PATH = (config : SharedConfig) => RECORDS_PATH(config) + "@:db_pass" ;
export const SINGLE_RECORD_PATH = (config : SharedConfig) => RECORDS_PATH(config) + "/:id";
export const LOGIN_PAGE_PATH = "/login";

// Cookies
export const COOKIE_DURATION = 31 * 24 * 3600 * 1000 // one month;

export const COOKIE_PREFIX = "wl_";
export const LANG_COOKIE = COOKIE_PREFIX + "lang";
export const SECRET_COOKIE = (dbName:string) => {return COOKIE_PREFIX + `secret_${dbName}`};

export function recordsLink(config:SharedConfig, dbName: string) {
    return RECORDS_PATH(config).replace(':db_name', dbName);
}

export function singleRecordLink(config:SharedConfig, dbName: string, recordId:string) {
    return SINGLE_RECORD_PATH(config)
        .replace(':db_name', dbName)
        .replace(":id", recordId);
}



// REST
export const API_BASE_URL = "/api";
export const ADD_ITEM_URL = "/api/:db_name/create";
export const UPDATE_ITEM_URL = "/api/:db_name/update";
export const DELETE_ITEM_URL = "/api/:db_name/delete/:id";
export const GET_ITEM_URL = "/api/:db_name/item/:id";
export const GET_ITEMS_URL = "/api/:db_name/items";
export const GET_ITEMS_GEO_URL = "/api/:db_name/items-coords";
export const COUNT_ITEMS_URL = "/api/:db_name/count";
export const GET_DB_DEFINITION_URL = "/api/:db_name/definition";


// Auth
export const LOGIN_URL = "/api/auth/login";
export const REGISTER_URL = "/api/auth/register";
export const LOGOUT_URL = "/api/auth/logout";

export const CREATE_DB_URL = "/api/create-db/";
export const CHECK_DB_NAME = "/api/check-db/:db_name";
export const UPDATE_DB_URL = "/api/update-db/:db_name";
export const UPDATE_SCHEMA_URL = "/api/update-schema/:db_name";

// Admin setup
export const INIT_INDEXES_URL = "/api/create_indexes/:db_name";

export const DOWNLOAD_XLS_URL  = "/xls/:db_name";
export const DOWNLOAD_JSON_URL  = "/json/:db_name";

export const VALIDATION_ERROR_STATUS_CODE = 444;

export interface SharedConfig {
    singleDb : string;
}

// Marshalled JSON within the page, containing static & config data
export interface IMarshalledContext {
    state: IState,
    env:string,
    lang:string,
    supportedLanguages: Language[],
    config : SharedConfig;
}


export type Marker = Record | Cluster;

// Generic reader interface, implemented directly with DB access for SSR, or as rest client on Browser
export interface DataFetcher {
    getRecord(dbName: string, id : string) : Promise<Record>;
    getRecords(dbName: string, filters?: Map<Filter>, search?:string, sort?: ISort, from?:number, limit?:number) : Promise<Record[]>;

    // Get records location, potentially grouped by clusters
    getRecordsGeo(dbName: string, zoom:number, filters?: Map<Filter>, search?:string, extraFields?:string[]) : Promise<Marker[]>;

    countRecords(dbName: string, filters?: Map<Filter>, search?:string) : Promise<number>;
    getDbDefinition(dbName:string) : Promise<DbDefinition>;
}