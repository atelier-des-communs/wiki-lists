import Axios, {AxiosPromise} from "axios";
import {Record} from "../../shared/model/instances";
import {
    ADD_ITEM_URL, Autocomplete, AUTOCOMPLETE_URL,
    CHECK_DB_NAME, COUNT_ITEMS_URL,
    CREATE_DB_URL,
    DataFetcher,
    DELETE_ITEM_URL,
    GET_DB_DEFINITION_URL,
    GET_ITEM_URL, GET_ITEMS_GEO_URL,
    GET_ITEMS_URL, Marker,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL,
    VALIDATION_ERROR_STATUS_CODE
} from "../../shared/api";
import {StructType} from "../../shared/model/types";
import {ValidationErrors} from "../../shared/validators/validators";
import {DbDefinition} from "../../shared/model/db-def";
import {empty, Map, mapValues} from "../../shared/utils";
import {post, get, del} from "./common";
import {Filter, serializeFilters, serializeSearch, serializeSortAndFilters} from "../../shared/views/filters";
import {ISort} from "../../shared/views/sort";
import * as QueryString from "querystring";
import {Cluster} from "../../shared/model/geo";

/** Return the full item with new _id */
export async function createItem(dbName: string, item : Record) : Promise<Record> {
    return await post(
        ADD_ITEM_URL.replace(":db_name", dbName),
        item);
}

/** Return the image of the update item, as saved in DB */
export async function updateItem(dbName: string, item : Record) : Promise<Record> {
    return await post(
        UPDATE_ITEM_URL.replace(":db_name", dbName),
        item);
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

// Data fetcher on client side, using REST service
export let restDataFetcher : DataFetcher = {

    async getDbDefinition(dbName:string) : Promise<DbDefinition>{
        return await get<DbDefinition>(
                GET_DB_DEFINITION_URL
                    .replace(":db_name", dbName));
    },

    async getRecord(dbName:string, id:string) : Promise<Record> {
        return await get(GET_ITEM_URL
                .replace(":db_name", dbName)
                .replace(":id", id));
    },

    async getRecords(dbName:string, filters: Map<Filter> = {}, search: string=null, sort:ISort, from:number=0, limit:number=-1) : Promise<Record[]> {

        let params = serializeSortAndFilters(sort, filters, search);
        if (from > 0) {
            params['from'] = from;
        }
        if (limit > -1) {
            params['limit'] = limit;
        }

        let url = GET_ITEMS_URL.replace(":db_name", dbName)
            + "?" + QueryString.stringify(params);

        return await get<Record[]>(url);
    },

    async getRecordsGeo(dbName:string, zoom:number, filters: Map<Filter> = {}, search: string=null, extraFields : string[]=[]) : Promise<Marker[]> {

        let params = serializeSortAndFilters(null, filters, search);
        params['zoom'] = zoom;
        params['fields'] = extraFields;

        let url = GET_ITEMS_GEO_URL.replace(":db_name", dbName) + "?" + QueryString.stringify(params);

        console.debug("fetch coords records", url);

        return await get<Record[]>(url);
    },

    async countRecords(dbName: string, filters?: Map<Filter>, search?: string): Promise<number> {
        let params = {
            ...serializeFilters(mapValues(filters)),
            ...serializeSearch(search)
        };

        let url = COUNT_ITEMS_URL.replace(":db_name", dbName)
            + "?" + QueryString.stringify(params);

        return await get<number>(url);
    },

    async autocomplete(dbName: string, attrName: string, query: string): Promise<Autocomplete[]> {
        let url = AUTOCOMPLETE_URL.
            replace(":db_name", dbName).
            replace(":attr", attrName)
        + "?" + QueryString.stringify({q:query});
        return await get<Autocomplete[]>(url)
    }
};







