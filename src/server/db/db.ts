import {EnumType, StructType, Types} from "../../shared/model/types";
import config from "../config"
import {MongoClient, Cursor} from "mongodb";
import {Record} from "../../shared/model/instances";
import {validateSchemaAttributes} from "../../shared/validators/schema-validators";
import {dieIfErrors} from "../../shared/validators/validators";
import {validateRecord} from "../../shared/validators/record-validator";
import {DataFetcher, SECRET_COOKIE} from "../../shared/api";
import {isIn, Map, mapMap, mapValues} from "../../shared/utils";
import {IMessages} from "../../shared/i18n/messages";
import {AccessRight} from "../../shared/access";
import {getAccessRights, HttpError} from "../utils";
import {Request} from "express-serve-static-core"
import * as shortid from "shortid";
import {DbDefinition} from "../../shared/model/db-def";
import {Filter} from "../../shared/views/filters";
import {ISort} from "../../shared/views/sort";

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

// Part of Db Settings that can be overriden


export async function updateSchemaDb(dbName: string, schema:StructType, _:IMessages) : Promise<StructType> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);

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

    let result = await col.updateOne({name: dbName}, {$set : {schema:schema}});
    if (result.matchedCount != 1) {
        throw new Error(`db not found : ${dbName}`);
    }
    return schema;
}

export async function createDb(def: DbDefinition, _:IMessages) : Promise<DbDefinition> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);

    // Validate attributes
    dieIfErrors(validateSchemaAttributes(def.schema.attributes, _));

    // UID
    (def as any)._id = shortid.generate();

    // FIXME add server side validators of name, label etc
    def.secret = shortid.generate();

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
    delete record._id;

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

// DataFetcher for SSR : direct access to DB
export class DbDataFetcher implements DataFetcher {

    request : Request;

    constructor(request: Request) {
        this.request = request;
    }

    async getDbDefinition(dbName: string) : Promise<DbDefinition> {
        let dbDef = await getDbDef(dbName);

        // Decorate Db with user rights
        let pass = this.request.cookies[SECRET_COOKIE(dbName)];
        dbDef.userRights = await getAccessRights(dbName, pass);

        // Remove secret for non admins
        // TODO : FIXME dangerous ...
        if (!isIn(dbDef.userRights, AccessRight.ADMIN)) {
            delete dbDef.secret;
        }

        return dbDef;
    }

    async getRecord(dbName:string, id:string) : Promise<Record> {
        let col = await Connection.getDbCol(dbName);
        let record = await col.findOne({_id: id});
        if (!record) throw new Error(`Missing db: ${dbName}`);
        return record;
    }

    async baseQuery(dbName: string, filters: Map<Filter> = {}, search:string=null) : Promise<Cursor<Record>> {
        let col = await Connection.getDbCol(dbName);

        // Build mongo filters
        let mongoFilters = mapValues(filters).map(f => f.mongoFilter()).filter(f => f !== null);
        let filter = null;

        console.debug('filters', mongoFilters);
        if (mongoFilters.length == 1) {
            filter = mongoFilters[0]
        } else if (mongoFilters.length >= 1) {
            filter = {$and : mongoFilters}
        }

        // Base query
        return col.find(filter);
    }

    async getRecords(
        dbName: string,
        filters: Map<Filter> = {},
        search:string=null,
        sort:ISort,
        from:number=null,
        limit:number=null) : Promise<Record[]> {

        let cursor = await this.baseQuery(dbName, filters, search);

        // Sort
        if (sort) {
            cursor = cursor.sort({[sort.key]: (sort.asc ? 1 : - 1)})
        }

        // From & Limit
        if (from != null) {
            cursor = cursor.skip(from);
        }
        if (limit != null) {
            cursor = cursor.limit(limit);
        }
        return await cursor.toArray();
    }

    async countRecords(dbName: string, filters: Map<Filter> = {}, search:string=null) : Promise<number> {
        let cursor = await this.baseQuery(dbName, filters);
        return cursor.count();
    }

}
