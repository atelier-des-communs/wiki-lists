import Axios from "axios";
import {AxiosPromise} from "axios";
import {Record} from "../model/instances";
import {ADD_ITEM_URL, DELETE_ITEM_URL, UPDATE_ITEM_URL, UPDATE_SCHEMA_URL, VALIDATION_STATUS_CODE} from "./api";
import {StructType} from "../model/types";
import {ValidationException} from "../validators/validators";

let axios = Axios.create();

// Catch sepcific status code and unwrap it as a validation exception
function unwrapAxiosResponse<T>(promise : AxiosPromise<T>) : Promise<T> {
    return promise.then((response: any) => {
        return response.data;
    }).catch(error => {
       console.log("Sever error happened", error);

       // In case of validation error, wrap the errors into proper ValidationException
       if (error.response && error.response.status == VALIDATION_STATUS_CODE) {
           throw new ValidationException(error.response.data);
       } else {
           alert("A network error happened : " + error);
           // otherwize, continue
           throw error;
       }
    });
}

/** Return the full item with new _id */
export async function createItem(dbName: string, item : Record) : Promise<Record> {
    return await unwrapAxiosResponse(
        axios.post(
            ADD_ITEM_URL.replace(":db_name", dbName),
            item));
}

/** Return the image of the update item, as saved in DB */
export async function updateItem(dbName: string, item : Record) : Promise<Record> {
    return await unwrapAxiosResponse(
        axios.post(
            UPDATE_ITEM_URL.replace(":db_name", dbName),
            item));
}

/** Return the image of the update item, as saved in DB */
export async function updateSchema(dbName: string, schema:StructType) : Promise<StructType> {
    return await unwrapAxiosResponse(
        axios.post(
            UPDATE_SCHEMA_URL.replace(":db_name", dbName),
            schema));
}

/** Return the image of the update item, as saved in DB */
export async function deleteItem(dbName: string, id : string) : Promise<boolean> {
    return await unwrapAxiosResponse(
        axios.post(
            DELETE_ITEM_URL
            .replace(":db_name", dbName)
            .replace(":id", id)));
}



