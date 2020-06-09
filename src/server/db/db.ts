import {EnumType, StructType, Types} from "../../shared/model/types";
import config from "../config"
import {MongoClient} from "mongodb";
import {Record} from "../../shared/model/instances";
import {validateSchemaAttributes} from "../../shared/validators/schema-validators";
import {dieIfErrors} from "../../shared/validators/validators";
import {validateRecord} from "../../shared/validators/record-validator";
import {DataFetcher} from "../../shared/api";
import {isIn} from "../../shared/utils";
import {IMessages} from "../../shared/i18n/messages";
import {AccessRight, hasDbRight} from "../../shared/access";
import {Request} from "express-serve-static-core"
import * as shortid from "shortid";
import {DbDefinition} from "../../shared/model/db-def";
import {HttpError} from "../../shared/errors";
import {IUser} from "../../shared/model/user";

const DATABASES_COL = "schemas";
const DATABASE_COL_TEMPLATE = (name:string) => {return `db.${name}`};

/* Singleton instance */
class  Connection {
    static client : MongoClient;
    static async getDb() {
        if (!this.client) {
            this.client = await MongoClient.connect(`mongodb://${config.DB_HOST}:${config.DB_PORT}/`);
        }
        return this.client.db(config.DB_NAME);
    }

    // Returns collection of items for a given database
    static async getDbCol(dbName : string) {
        let db = await Connection.getDb();
        return db.collection(DATABASE_COL_TEMPLATE(dbName));
    }
}


// Create collections / indexes
async function init() : Promise<void> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);
    col.createIndex(
        {"name": 1},
        { unique: true });
}

export async function updateDb(dbName:string, update : Partial<DbDefinition>) {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);
    let result = await col.updateOne({name: dbName}, {$set : update});
    if (result.matchedCount != 1) {
        throw new Error(`db not found : ${dbName}`);
    }
}

// Part of Db Settings that can be overriden
export async function updateSchemaDb(dbName: string, schema:StructType, _:IMessages) : Promise<StructType> {

    // Validate errors
    dieIfErrors(validateSchemaAttributes(schema.attributes, _));

    // Mark attributes as saved
    // FIXME : do otherwize - mark new types and atributes as new and don't save it
    for (let attr of schema.attributes) {

        // Mark each enum record as saved
        if (attr.type.tag == Types.ENUM) {
            (attr.type as EnumType).values.map(enumVal => enumVal.saved = true);
        }
    }
    updateDb(dbName, {schema});
    return schema;
}

export async function createDb(def: DbDefinition, _:IMessages) : Promise<DbDefinition> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);

    // Validate attributes
    dieIfErrors(validateSchemaAttributes(def.schema.attributes, _));

    // UID
    (def as any)._id = shortid.generate();

    let result = await col.insertOne(def);
    if (result.insertedCount != 1) {
        throw new Error(`Db not created`);
    }
    return def;
}




export async function updateRecordDb(dbName: string, record : Record, _:IMessages) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);
    let dbDef = await getDbDef(dbName);

    // Validate record
    dieIfErrors(validateRecord(record, dbDef.schema, _, false));

    let id = record._id;

    // Readonly attributes : no update
    delete record._id;
    delete record._user;
    delete record._creationTime;
    delete record._pos;

    // Update time
    record._updateTime = new Date();

    let res = await col.updateOne({_id: id}, { $set : record});
    if (res.matchedCount != 1) {
        throw Error(`No item matched for id : ${id}`);
    }
    return await col.findOne({_id: id});
}


export async function createRecordDb(dbName: string, record : Record, _:IMessages) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);
    let dbDef = await getDbDef(dbName);

    // Validate record
    dieIfErrors(validateRecord(record, dbDef.schema, _, true));


    if (record._id) {
        throw new Error("New records should not have _id yet");
    }

    record._id = shortid.generate();

    if (typeof(record._pos) == "undefined" || record._pos == null) {
        // Use current timestamp for position : avoid searching for largest _pos in db
        record._pos = Date.now();
    }

    record._creationTime = new Date();

    await col.insertOne(record);
    return record;
}

export async function deleteRecordDb(dbName: string, id : string) : Promise<boolean> {
    let col = await Connection.getDbCol(dbName);
    let res = await col.deleteOne({_id : id});
    if (res.deletedCount != 1) {
        throw Error(`No record deleted with id: ${id}`);
    }
    return true;
}

export async function checkAvailability(dbName:string) : Promise<boolean> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);
    let database = await col.findOne({name: dbName});
    return (database == null);
}

export async function getDbDef(dbName: string) : Promise<DbDefinition> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);
    let database = await col.findOne({name: dbName});
    if (!database) throw new HttpError(404, `Missing db: ${dbName}`);
    return database;
}

function filterDbDef(dbDef:DbDefinition, user:IUser) {

    // XXX : bad design : filter out other member emails
    if (dbDef.member_emails && !hasDbRight(dbDef, user, AccessRight.ADMIN)) {
        dbDef.member_emails = dbDef.member_emails.filter(email => (user != null) && email == user.email);
    }
    return dbDef
}

// DataFetcher for SSR : direct access to DB
export class DbDataFetcher implements DataFetcher {

    request : Request;

    constructor(request: Request) {
        this.request = request;
    }

    async getDbDefinition(dbName: string, user:IUser, messages:IMessages) : Promise<DbDefinition> {
        let dbDef = await getDbDef(dbName);

        //if (!hasDbRight(dbDef, user, AccessRight.VIEW)) {
        //    throw new HttpError(401, messages.private_db);
        //}

        return filterDbDef(dbDef, user);
    }

    async listDbDefinitions(user:IUser) : Promise<DbDefinition[]> {
        let db = await Connection.getDb();
        let col = db.collection<DbDefinition>(DATABASES_COL);
        let res = await col.find({}).toArray();
        return res.map(dbdef => filterDbDef(dbdef, user)).filter(dbDef => hasDbRight(dbDef, user, AccessRight.VIEW));
    }

    async getRecord(dbName:string, id:string, user:IUser, messages:IMessages) : Promise<Record> {
        let col = await Connection.getDbCol(dbName);
        let dbDef = await getDbDef(dbName);

        if (!hasDbRight(dbDef, user, AccessRight.VIEW)) {
            throw new HttpError(401, messages.private_db);
        }

        let record = await col.findOne({_id: id});
        if (!record) throw new Error(`Missing db: ${dbName}`);
        return record;
    }

    async getRecords(dbName: string, user:IUser, messages:IMessages) : Promise<Record[]> {

        let col = await Connection.getDbCol(dbName);
        let dbDef = await getDbDef(dbName);

        if (!hasDbRight(dbDef, user, AccessRight.VIEW)) {
            throw new HttpError(401, messages.private_db);
        }

        let cursor = await col.find();
        return await cursor.toArray();
    }

}
