import {
    ADD_ITEM_URL,
    API_BASE_URL,
    CHECK_DB_NAME,
    CREATE_DB_URL,
    DELETE_ITEM_URL,
    GET_DB_DEFINITION_URL,
    GET_ITEM_URL,
    GET_ITEMS_URL,
    LIST_DEFINITIONS_URL, RECORDS_PATH, UPDATE_EMAILS_URL,
    UPDATE_ITEM_URL,
    UPDATE_SCHEMA_URL
} from "../../shared/api";
import {
    checkAvailability,
    createDb,
    createRecordDb,
    DbDataFetcher,
    deleteRecordDb, getDbDef, updateDb,
    updateRecordDb,
    updateSchemaDb
} from "../db/db";
import {Record} from "../../shared/model/instances";
import {requiresDbRight, requiresRecordRight, returnPromise, traverse} from "../utils";
import {Express} from "express";
import {StructType} from "../../shared/model/types";
import {Request, RequestHandler, Response} from "express-serve-static-core"
import {AccessRight, hasDbRight} from "../../shared/access";
import * as xss from "xss";
import {selectLanguage} from "../i18n/messages";
import {toAnnotatedJson, toTypedObjects} from "../../shared/serializer";
import {DbDefinition} from "../../shared/model/db-def";
import * as mung from "express-mung";
import {IMessages} from "../../shared/i18n/messages";
import {HttpError} from "../../shared/errors";
import {difference} from "lodash";
import {expireDate, Token} from "../db/mongoose";
import {emailTemplates} from "../email/templates";
import {connectLink} from "./auth";
import {sendMail} from "../email/email";

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
    await requiresRecordRight(req, record, AccessRight.EDIT);
    return updateRecordDb(
        req.params.db_name,
        record,
        selectLanguage(req).messages);
}



async function updateSchemaAsync(req:Request) : Promise<StructType>{
    let schema = req.body as StructType;
    await requiresDbRight(req, AccessRight.ADMIN);
    return updateSchemaDb(
        req.params.db_name,
        schema,
        selectLanguage(req).messages);
}

async function updateEmailsAsync(req:Request) : Promise<DbDefinition>{
    let emails = req.body as string[];
    await requiresDbRight(req, AccessRight.ADMIN);
    let dbDef = await getDbDef(req.params.db_name);

    let newEmails = difference(emails, dbDef.member_emails || []);

    for (let email of newEmails) {
        let token = await Token.create({
            email,
            expires:expireDate(60*24*30),
            redirect:RECORDS_PATH.replace(":db_name", dbDef.name)});
        let emailContent = emailTemplates[req.language].inviteEmail(connectLink(token), dbDef.label);

        // Send mail not waiting for it
        sendMail(email, emailContent);
    }

    dbDef.member_emails = emails;
    updateDb(dbDef.name, dbDef)
    return dbDef;
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


export function setUp(server:Express) {


    // Add middleware in input / output to transform into json with type information
    server.use(API_BASE_URL, safeInput);
    server.use(API_BASE_URL, mung.json(decorateOutput));

    // Routes

    server.post(ADD_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, addItemAsync(req));
    });

    server.post(UPDATE_ITEM_URL, function (req: Request, res: Response) {
        returnPromise(res, updateItemAsync(req));
    });

    server.delete(DELETE_ITEM_URL, function (req: Request, res: Response) {
        let _ = selectLanguage(req).messages;
        returnPromise(res, async function() : Promise<{}> {
            let id = req.params.id;
            let record = await new DbDataFetcher(req).getRecord(req.params.db_name, id, req.session.user, _);
            await requiresRecordRight(req, record, AccessRight.DELETE);
            return deleteRecordDb(req.params.db_name, id);
        }());
    });

    server.post(UPDATE_SCHEMA_URL, function (req: Request, res: Response) {
        returnPromise(res, updateSchemaAsync(req));
    });

    server.post(UPDATE_EMAILS_URL, function (req: Request, res: Response) {
        returnPromise(res, updateEmailsAsync(req));
    });


    server.post(CREATE_DB_URL, function (req: Request, res: Response) {
        returnPromise(res, createDbAsync(req, res));
    });

    server.get(CHECK_DB_NAME, function (req: Request, res: Response) {
        returnPromise(res, checkAvailability(req.params.db_name));
    });

    server.get(GET_ITEM_URL, function (req: Request, res: Response) {
        let _ : IMessages = selectLanguage(req).messages;
        returnPromise(res, new DbDataFetcher(req).getRecord(req.params.db_name, req.params.id, req.session.user, _));
    });

    server.get(GET_ITEMS_URL, function (req: Request, res: Response) {
        let _ = selectLanguage(req).messages;
        returnPromise(res, new DbDataFetcher(req).getRecords(req.params.db_name, req.session.user, _));
    });

    server.get(LIST_DEFINITIONS_URL, function (req: Request, res: Response) {;
        returnPromise(res, new DbDataFetcher(req).listDbDefinitions(req.session.user));
    });

    server.get(GET_DB_DEFINITION_URL, function (req: Request, res: Response) {
        let _ : IMessages = selectLanguage(req).messages;
        returnPromise(res, new DbDataFetcher(req).getDbDefinition(req.params.db_name, req.session.user, _));
    });

}



