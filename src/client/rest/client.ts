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
    VALIDATION_STATUS_CODE
} from "../../shared/api";
import {StructType} from "../../shared/model/types";
import {ValidationErrors, ValidationException} from "../../shared/validators/validators";
import {DbDefinition} from "../../shared/model/db-def";
import {empty} from "../../shared/utils";
import {toAnnotatedJson, toTypedObjects} from "../../shared/serializer";

const axios = Axios.create();


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
    return await unwrapAxiosResponse(axios.get(
        CHECK_DB_NAME.replace(":db_name", dbName)));
}

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

    async getRecords(dbName:string) : Promise<Record[]> {
        return await get<Record[]>(GET_ITEMS_URL
                .replace(":db_name", dbName));
    }
};

// For simple action transform the promise into a Promise of either null (success) or list of validation errors
// FIXME : this sucks : too much complicated ...
export function toPromiseWithErrors(promise : Promise<{}>) : Promise<null | ValidationErrors> {
    return promise
        .then(res => null)
        .catch(e => {
            if (e.validationErrors) {
                return e.validationErrors;
            } else {
                // Rethrow
                throw e;
            }});
}


// Catch sepcific status code and unwrap it as a validation exception
function unwrapAxiosResponse<T>(promise : AxiosPromise<T>) : Promise<T> {
    return promise.then((response: any) => {

        // Parse type annotation and add prototypes
        return toTypedObjects(response.data);

    }).catch(error => {
        console.info("Server error happened", error);

        // In case of validation error, wrap the errors into proper ValidationException
        if (error.response && error.response.status == VALIDATION_STATUS_CODE) {

            console.info("Transformed to validation exception", error.response.data);
            throw new ValidationException(error.response.data);

        } else {

            alert("A network error happened : " + error);
            throw error;
        }
    });
}


/** Add type information before sending */
async function post<T>(url:string, data:any=null) : Promise<T> {
    let json = toAnnotatedJson(data);
    return unwrapAxiosResponse<T>(axios.post(url, json));
}

async function del<T>(url:string, data:any=null) : Promise<T> {
    let json = toAnnotatedJson(data);
    return unwrapAxiosResponse<T>(axios.delete(url, json));
}

async function get<T>(url:string) : Promise<T> {
    return unwrapAxiosResponse<T>(axios.get(url));
}



