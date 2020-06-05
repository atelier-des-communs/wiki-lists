import {
    ADD_SUBSCRIPTION_URL,
    ADD_ITEM_URL,
    API_BASE_URL,
    AUTOCOMPLETE_URL,
    CHECK_DB_NAME,
    CLEAR_CACHE,
    COOKIE_DURATION,
    COUNT_ITEMS_URL,
    CREATE_DB_URL,
    DELETE_ITEM_URL,
    GET_DB_DEFINITION_URL,
    GET_ITEM_URL,
    GET_ITEMS_GEO_URL,
    GET_ITEMS_URL,
    GET_SUBSCRIPTION,
    INIT_INDEXES_URL,
    SECRET_COOKIE,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL, VALIDATION_ERROR_STATUS_CODE, UPDATE_SUBSCRIPTION_URL
} from "../../shared/api";
import {
    setSubscriptionDb,
    checkAvailability,
    createDb,
    createOrUpdateRecordsDb,
    SSRDataFetcher,
    deleteRecordDb,
    getDbDef,
    setUpIndexesDb,
    updateSchemaDb, updateSubscriptionDb
} from "../db/db";
import {Record} from "../../shared/model/instances";
import {dbNameSSR, requiresRight, returnPromise, traverse} from "../utils";
import {Express} from "express";
import {StructType} from "../../shared/model/types";
import {Request, RequestHandler, Response} from "express-serve-static-core"
import {AccessRight} from "../../shared/access";
import * as xss from "xss";
import {selectLanguage} from "../i18n/messages";
import {toAnnotatedJson, toTypedObjects} from "../../shared/serializer";
import {DbDefinition} from "../../shared/model/db-def";
import * as mung from "express-mung";
import {extractSort} from "../../shared/views/sort";
import {empty, Map, oneToArray, parseBool, strToInt} from "../../shared/utils";
import {extractFilters, extractSearch, TextFilter} from "../../shared/views/filters";
import {config} from "../config";
import {BadRequestException, ForbiddenException, HttpError} from "../exceptions";
import * as request from "request-promise";
import {clearCache} from "../cache";
import {sendNewAlertEmail} from "../notifications/templates/new-alert-template";
import * as crypto from "crypto";
import {Subscription} from "../../shared/model/notifications";
import * as HttpStatus from "http-status-codes";
import {updateSubscription} from "../../client/rest/client-db";




const CAPTCHA_CHECK_URL="https://www.google.com/recaptcha/api/siteverify"

async function addItemsAsync(req:Request) : Promise<Record[] | Record> {
    let records = req.body as Record | Record[];
    await requiresRight(req, AccessRight.EDIT);

    let createOnly = parseBool(req.query.createOnly);
    let noNotif = parseBool(req.query.noNotif);

    if (records instanceof Array) {
        return createOrUpdateRecordsDb(
            dbNameSSR(req),
            records,
            selectLanguage(req).messages,
            createOnly, noNotif);
    } else {
        // Single one ?
        return createOrUpdateRecordsDb(
            dbNameSSR(req),
            oneToArray(records),
            selectLanguage(req).messages,
            createOnly, noNotif)
            .then(records => records[0]);
    }
}

async function setupIndexes(req:Request) : Promise<boolean> {
    await requiresRight(req, AccessRight.ADMIN);
    setUpIndexesDb(dbNameSSR(req));
    return true;
}

async function resetCache(req:Request) : Promise<boolean> {
    await requiresRight(req, AccessRight.ADMIN);
    clearCache();
    return true;
}

async function updateItemAsync(req:Request) : Promise<Record>{
    let record = req.body as Record;
    await requiresRight(req, AccessRight.EDIT);
    let noNotif = parseBool(req.query.noNotif);
    return createOrUpdateRecordsDb(
        dbNameSSR(req),
        [record],
        selectLanguage(req).messages,
        false, noNotif);
}

async function deleteItemAsync(req:Request) : Promise<boolean>{
    let id = req.params.id;
    await requiresRight(req, AccessRight.DELETE);
    return deleteRecordDb(dbNameSSR(req), id);
}

async function updateSchemaAsync(req:Request) : Promise<StructType>{
    let schema = req.body as StructType;
    await requiresRight(req, AccessRight.ADMIN);
    return updateSchemaDb(
        dbNameSSR(req),
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

async function addSubscriptionAsync(req:Request) : Promise<boolean> {

    let filters = req.body.filters as Map<string>;
    let email = req.body.email as string;
    let schema = await getDbDef("vigibati");

    if (empty(req.body.captcha)) {
        throw new ForbiddenException("Captcha is required");
    }

    let captchares : any = await request({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method:"POST",
        uri: CAPTCHA_CHECK_URL,
        form: {
            response : req.body.captcha,
            secret : config.CAPTCHA_SECRET},
        json:true
    });

    console.debug("Captcha response", captchares);

    if (!captchares.success) {
        throw new BadRequestException("Invalid captcha");
    }

    await setSubscriptionDb(dbNameSSR(req), {email, filters});

    let filtersObjs = extractFilters(schema.schema, filters);

    let city = filtersObjs['commune'] as TextFilter

    // Send email : don't wait for it
    sendNewAlertEmail(email, city.search)

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

    server.post(CLEAR_CACHE, function (req: Request, res: Response) {
        returnPromise(res, resetCache(req));
    });

    server.post(CREATE_DB_URL, function (req: Request, res: Response) {
        returnPromise(res, createDbAsync(req, res));
    });

    server.post(ADD_SUBSCRIPTION_URL, function (req: Request, res: Response) {
        returnPromise(res, addSubscriptionAsync(req));
    });

    server.post(UPDATE_SUBSCRIPTION_URL, function (req: Request, res: Response) {
        returnPromise(res, updateSubscriptionDb(
            dbNameSSR(req),
            req.body,
            req.query.secret));
    });

    server.get(CHECK_DB_NAME, function (req: Request, res: Response) {
        returnPromise(res, checkAvailability(dbNameSSR(req)));
    });

    server.get(GET_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, new SSRDataFetcher(req).getRecord(dbNameSSR(req), req.params.id).then(
            record => {
                if (record == null) throw new HttpError(HttpStatus.NOT_FOUND, "Record not found");
                return record;
            }));
    });

    server.get(AUTOCOMPLETE_URL, function (req: Request, res: Response) {

        returnPromise(res, new SSRDataFetcher(req).autocomplete(
            dbNameSSR(req),
            req.params.attr,
            req.query.q,
            parseBool(req.query.geo)));
    });

    server.get(GET_ITEMS_URL, async function (req: Request, res: Response) {

        let fetcher = new SSRDataFetcher(req);
        let schema = await fetcher.getDbDefinition(dbNameSSR(req));

        // Extract filters
        let sort = extractSort(req.query);
        let search = extractSearch(req.query);
        let filters = extractFilters(schema.schema, req.query);
        let from = strToInt(req.query.from);
        let limit = strToInt(req.query.limit);

        returnPromise(res, fetcher.getRecords(
            dbNameSSR(req),
            filters,
            search,
            sort,
            from,
            limit));
    });

    server.get(GET_ITEMS_GEO_URL, async function (req: Request, res: Response) {

        let fetcher = new SSRDataFetcher(req);
        let schema = await fetcher.getDbDefinition(dbNameSSR(req));

        // Extract filters
        let search = extractSearch(req.query);
        let filters = extractFilters(schema.schema, req.query);
        let zoom = parseInt(req.query.zoom);

        let fields = oneToArray(req.query.fields);

        returnPromise(res, fetcher.getRecordsGeo(
            dbNameSSR(req),
            zoom,
            filters,
            search,
            fields));
    });

    server.get(COUNT_ITEMS_URL, async function (req: Request, res: Response) {

        let fetcher = new SSRDataFetcher(req);
        let schema = await fetcher.getDbDefinition(dbNameSSR(req));

        // Search & filter
        let search = extractSearch(req.query);
        let filters = extractFilters(schema.schema, req.query);

        returnPromise(res, fetcher.countRecords(
            dbNameSSR(req),
            filters,
            search)
            .then((count) => {return "" + count}));
    });

    server.get(GET_SUBSCRIPTION, async function (req: Request, res: Response) {
        let fetcher = new SSRDataFetcher(req);
        returnPromise(res,
            fetcher.getSubscription(
                req.query.email,
                req.query.secret));
    });

    server.get(GET_DB_DEFINITION_URL, function (req: Request, res: Response) {
        returnPromise(res, new SSRDataFetcher(req).getDbDefinition(dbNameSSR(req)));
    });

}




