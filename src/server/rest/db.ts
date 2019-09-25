import {
    ADD_ITEM_URL, API_BASE_URL,
    CHECK_DB_NAME,
    COOKIE_DURATION, COUNT_ITEMS_URL,
    CREATE_DB_URL,
    DELETE_ITEM_URL,
    GET_DB_DEFINITION_URL,
    GET_ITEM_URL, GET_ITEMS_GEO_URL,
    GET_ITEMS_URL, INIT_INDEXES_URL,
    SECRET_COOKIE,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL
} from "../../shared/api";
import {
    checkAvailability,
    createDb,
    createRecordsDb,
    DbDataFetcher,
    deleteRecordDb, getDbDef, setUpIndexesDb,
    updateRecordDb,
    updateSchemaDb
} from "../db/db";
import {Record} from "../../shared/model/instances";
import {requiresRight, returnPromise, traverse} from "../utils";
import {Express} from "express";
import {StructType} from "../../shared/model/types";
import {Request, Response, RequestHandler} from "express-serve-static-core"
import {AccessRight} from "../../shared/access";
import * as xss from "xss";
import {selectLanguage} from "../i18n/messages";
import {toAnnotatedJson, toTypedObjects} from "../../shared/serializer";
import {DbDefinition} from "../../shared/model/db-def";
import * as mung from "express-mung";
import {extractSort} from "../../shared/views/sort";
import {oneToArray, sortBy, strToInt} from "../../shared/utils";
import {extractFilters, extractSearch} from "../../shared/views/filters";


async function addItemsAsync(req:Request) : Promise<Record[] | Record> {
    let records = req.body as Record | Record[];
    await requiresRight(req, AccessRight.EDIT);

    if (records instanceof Array) {
        return createRecordsDb(
            req.params.db_name,
            records,
            selectLanguage(req).messages);
    } else {
        return createRecordsDb(
            req.params.db_name,
            oneToArray(records),
            selectLanguage(req).messages).then(records => records[0]);
    }
}

async function setupIndexes(req:Request) : Promise<boolean> {
    await requiresRight(req, AccessRight.ADMIN);
    setUpIndexesDb(req.params.db_name);
    return true;
}

async function updateItemAsync(req:Request) : Promise<Record>{
    let record = req.body as Record;
    await requiresRight(req, AccessRight.EDIT);
    return updateRecordDb(
        req.params.db_name,
        record,
        selectLanguage(req).messages);
}

async function deleteItemAsync(req:Request) : Promise<boolean>{
    let id = req.params.id;
    await requiresRight(req, AccessRight.DELETE);
    return deleteRecordDb(req.params.db_name, id);
}

async function updateSchemaAsync(req:Request) : Promise<StructType>{
    let schema = req.body as StructType;
    await requiresRight(req, AccessRight.ADMIN);
    return updateSchemaDb(
        req.params.db_name,
        schema,
        selectLanguage(req).messages);
}

async function createDbAsync(req:Request, res:Response) : Promise<boolean>{
    let dbDef = req.body as DbDefinition;
    dbDef = await createDb(dbDef, selectLanguage(req).messages);

    // Set secret in cookies, for admin rights
    res.cookie(
        SECRET_COOKIE(dbDef.name),
        dbDef.secret,
        {maxAge:COOKIE_DURATION});
    return true;
}

function sanitizeJson(input:any) {
    let xssFunc = (obj: any, prop: string, value: any) : any => {
        if (typeof(value) == "string") {
            obj[prop] = xss(value);
        }
    };
    traverse(input, xssFunc);
    return input;
}

/** Add prototypes to incomming JSON, based on annotation.
 * Add XSS safety */
let safeInput : RequestHandler = (req, res, next) => {
    req.body = toTypedObjects(sanitizeJson(req.body));
    next()
};

let decorateOutput: mung.Transform = (body, req, res) => {
    return toAnnotatedJson(body);
};


export function setUp(server:Express) {

    // Add middleware in input / output to transform into json with type information
    server.use(API_BASE_URL, safeInput);
    server.use(API_BASE_URL, mung.json(decorateOutput));

    // Routes
    server.post(ADD_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, addItemsAsync(req));
    });

    server.post(UPDATE_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, updateItemAsync(req));
    });

    server.delete(DELETE_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, deleteItemAsync(req));
    });

    server.post(UPDATE_SCHEMA_URL, function (req: Request, res: Response) {
        returnPromise(res, updateSchemaAsync(req));
    });

    server.post(INIT_INDEXES_URL, function (req: Request, res: Response) {
        returnPromise(res, setupIndexes(req));
    });

    server.post(CREATE_DB_URL, function (req: Request, res: Response) {
        returnPromise(res, createDbAsync(req, res));
    });

    server.get(CHECK_DB_NAME, function (req: Request, res: Response) {
        returnPromise(res, checkAvailability(req.params.db_name));
    });

    server.get(GET_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, new DbDataFetcher(req).getRecord(req.params.db_name, req.params.id));
    });

    server.get(GET_ITEMS_URL, async function (req: Request, res: Response) {

        let fetcher = new DbDataFetcher(req);
        let schema = await fetcher.getDbDefinition(req.params.db_name);

        // Extract filters
        let sort = extractSort(req.query);
        let search = extractSearch(req.query);
        let filters = extractFilters(schema.schema, req.query);
        let from = strToInt(req.query.from);
        let limit = strToInt(req.query.limit);

        returnPromise(res, fetcher.getRecords(
            req.params.db_name,
            filters,
            search,
            sort,
            from,
            limit));
    });

    server.get(GET_ITEMS_GEO_URL, async function (req: Request, res: Response) {

        let fetcher = new DbDataFetcher(req);
        let schema = await fetcher.getDbDefinition(req.params.db_name);

        // Extract filters
        let search = extractSearch(req.query);
        let filters = extractFilters(schema.schema, req.query);
        let zoom = parseInt(req.query.zoom);

        let fields = oneToArray(req.query.fields);

        returnPromise(res, fetcher.getRecordsGeo(
            req.params.db_name,
            zoom,
            filters,
            search,
            fields));
    });

    server.get(COUNT_ITEMS_URL, async function (req: Request, res: Response) {

        let fetcher = new DbDataFetcher(req);
        let schema = await fetcher.getDbDefinition(req.params.db_name);

        // Search & filter
        let search = extractSearch(req.query);
        let filters = extractFilters(schema.schema, req.query);

        returnPromise(res, fetcher.countRecords(
            req.params.db_name,
            filters,
            search)
            .then((count) => {return "" + count}));
    });


    server.get(GET_DB_DEFINITION_URL, function (req: Request, res: Response) {
        returnPromise(res, new DbDataFetcher(req).getDbDefinition(req.params.db_name));
    });

}



