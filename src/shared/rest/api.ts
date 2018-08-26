

// HTML
export const RECORDS_PATH = "/db/:db_name";
export const SINGLE_RECORD_PATH = "/db/:db_name/:id";


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

export const UPDATE_SCHEMA_URL = "/api/:db_name/schema/update/";

export const DOWNLOAD_XLS_URL  = "/xls/:db_name";
export const DOWNLOAD_JSON_URL  = "/json/:db_name";

export const VALIDATION_STATUS_CODE = 444;