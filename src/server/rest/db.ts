import {
    ADD_ITEM_URL, API_BASE_URL,
    CHECK_DB_NAME,
    COOKIE_DURATION,
    CREATE_DB_URL,
    DELETE_ITEM_URL,
    GET_DB_DEFINITION_URL,
    GET_ITEM_URL,
    GET_ITEMS_URL, LIST_DEFINITIONS_URL,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL
} from "../../shared/api";
import {
    checkAvailability,
    createDb,
    createRecordDb,
    DbDataFetcher,
    deleteRecordDb,
    updateRecordDb,
    updateSchemaDb
} from "../db/db";
import {Record} from "../../shared/model/instances";
import {HttpError, requiresDbRight, requiresRecordRight, returnPromise, traverse} from "../utils";
import {Express} from "express";
import {StructType} from "../../shared/model/types";
import {Request, Response, RequestHandler} from "express-serve-static-core"
import {AccessRight} from "../../shared/access";
import * as xss from "xss";
import {selectLanguage} from "../i18n/messages";
import {toAnnotatedJson, toTypedObjects} from "../../shared/serializer";
import {DbDefinition} from "../../shared/model/db-def";
import * as mung from "express-mung";
import {Router} from "express";

async function addItemAsync(req:Request) : Promise<Record> {
    let record = req.body as Record;
    await requiresDbRight(req, AccessRight.ADD);

    // Add user id
    record._user = req.session.user ? req.session.user._id : null;

    return createRecordDb(
        req.params.db_name,
        record,
        selectLanguage(req).messages);
}

async function updateItemAsync(req:Request) : Promise<Record>{
    let record = req.body as Record;
    await requiresRecordRight(req, record._id, AccessRight.EDIT);
    return updateRecordDb(
        req.params.db_name,
        record,
        selectLanguage(req).messages);
}

async function deleteItemAsync(req:Request) : Promise<boolean>{
    let id = req.params.id;
    await requiresRecordRight(req, id, AccessRight.DELETE);
    return deleteRecordDb(req.params.db_name, id);
}

async function updateSchemaAsync(req:Request) : Promise<StructType>{
    let schema = req.body as StructType;
    await requiresDbRight(req, AccessRight.ADMIN);
    return updateSchemaDb(
        req.params.db_name,
        schema,
        selectLanguage(req).messages);
}

async function createDbAsync(req:Request, res:Response) : Promise<boolean>{

    if (!req.session.user) {
        throw new HttpError(401, "User should be logged");
    }

    let dbDef = req.body as DbDefinition;
    dbDef.admins = [req.session.user._id];
    await createDb(dbDef, selectLanguage(req).messages);
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

/** Add prototypes to incomming JSON, based on annotation, and remove it in output.
 * Add XSS safety */
let safeInput : RequestHandler = (req, res, next) => {
    req.body = toTypedObjects(sanitizeJson(req.body));
    next()
};

let decorateOutput: mung.Transform = (body, req, res) => {
    return toAnnotatedJson(body);
};


let router = Router(); 



    // Add middleware in input / output to transform into json with type information
router.use(API_BASE_URL, safeInput);
router.use(API_BASE_URL, mung.json(decorateOutput));

// Routes
router.post(ADD_ITEM_URL, function (req: Request, res: Response) {
    returnPromise(res, addItemAsync(req));
});

router.post(UPDATE_ITEM_URL, function (req: Request, res: Response) {
    returnPromise(res, updateItemAsync(req));
});

router.delete(DELETE_ITEM_URL, function (req: Request, res: Response) {
    returnPromise(res, deleteItemAsync(req));
});

router.post(UPDATE_SCHEMA_URL, function (req: Request, res: Response) {
    returnPromise(res, updateSchemaAsync(req));
});

router.post(CREATE_DB_URL, function (req: Request, res: Response) {
    returnPromise(res, createDbAsync(req, res));
});

router.get(CHECK_DB_NAME, function (req: Request, res: Response) {
    returnPromise(res, checkAvailability(req.params.db_name));
});

router.get(GET_ITEM_URL, function (req: Request, res: Response) {
    returnPromise(res, new DbDataFetcher(req).getRecord(req.params.db_name, req.params.id));
});

router.get(GET_ITEMS_URL, function (req: Request, res: Response) {
    returnPromise(res, new DbDataFetcher(req).getRecords(req.params.db_name));
});

router.get(LIST_DEFINITIONS_URL, function (req: Request, res: Response) {
    returnPromise(res, new DbDataFetcher(req).listDbDefinitions());
});

router.get(GET_DB_DEFINITION_URL, function (req: Request, res: Response) {
    returnPromise(res, new DbDataFetcher(req).getDbDefinition(req.params.db_name));
});

export default router;





