import {
    StructType,
    BooleanType,
    Type,
    NumberType,
    Attribute,
    TextType,
    Types,
    EnumType
} from "../../shared/model/types";
import {IState} from "../../shared/redux";
import {empty, Map} from "../../shared/utils";
import {DB_NAME, DB_PORT, DB_HOST} from "../../conf"
import {MongoClient, Db, ObjectId} from "mongodb";
import {Record} from "../../shared/model/instances";
import {_} from "../../shared/i18n/messages";
import {validateSchemaAttributes} from "../../shared/validators/schema-validators";
import {raiseExceptionIfErrors} from "../../shared/validators/validators";
import * as xss from "xss";
import {validateRecord} from "../../shared/validators/record-validator";
import {DataFetcher} from "../../shared/api";

const DATABASES_COL = "schemas";
const DATABASE_COL_TEMPLATE ="db.{name}";

/* Singleton instance */
class  Connection {
    static client : MongoClient;
    static async getDb() {
        if (!this.client) {
            this.client = await MongoClient.connect(`mongodb://${DB_HOST}:${DB_PORT}/`);
        }
        return this.client.db(DB_NAME);
    }

    static async getDbCol(dbName : string) {
        let db = await Connection.getDb();
        return db.collection(dbName);
    }
}


export interface DbSettings {
    label:string;
    description:string;
}

// Entire description, with read only fields
export interface DbDefinition extends DbSettings {
    name : string;
    schema: StructType;
    secret?:string;
}




export async function updateSchemaDb(dbName: string, schema:StructType) : Promise<StructType> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);

    // Validate errors
    raiseExceptionIfErrors(validateSchemaAttributes(schema.attributes))

    // Marked attributes as saved
    for (let attr of schema.attributes) {
        attr.saved = true;

        // Marke each enum record as saved
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


export async function updateRecordDb(dbName: string, record : Record) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);
    let dbDef = await dbDataFetcher.getDbDefinition(dbName);

    // Validate record
    raiseExceptionIfErrors(validateRecord(record, dbDef.schema));

    // Transform string ID to BSON ObjectID
    let copy = { ...record} as any;
    copy._id = new ObjectId(record._id);

    // Update time
    copy._updateTime = new Date();

    let res = await col.replaceOne({_id: copy._id}, copy);
    if (res.matchedCount != 1) {
        throw Error(`No item matched for id : ${record._id}`);
    }
    return record;
}


export async function createRecordDb(dbName: string, record : Record) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);
    let dbDef = await dbDataFetcher.getDbDefinition(dbName);

    // Validate record
    raiseExceptionIfErrors(validateRecord(record, dbDef.schema));


    if (record._id) {
        throw new Error("New records should not have _id yet");
    }

    if (typeof(record._pos) == "undefined" || record._pos == null) {
        // Use current timestamp for position : avoid searching for largest _pos in db
        record._pos = Date.now();
    }

    record._creationTime = new Date();

    let res = await col.insertOne(record);
    record._id = res.insertedId.toHexString();
    return record;
}

export async function deleteRecordDb(dbName: string, id : string) : Promise<boolean> {
    let col = await Connection.getDbCol(dbName);
    let res = await col.deleteOne({"_id" : new ObjectId(id)});
    if (res.deletedCount != 1) {
        throw Error(`No record deleted with id: ${id}`);
    }
    return true;
}

async function getDbDef(dbName: string) : Promise<DbDefinition> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(DATABASES_COL);
    let database = await col.findOne({name: dbName});
    if (!database) throw new Error(`Missing db: ${dbName}`);
    return database
}


export async function getDbSecret(dbName: string) : Promise<String> {
    let dbDef = await getDbDef(dbName);
    return dbDef.secret;
}

export let dbDataFetcher : DataFetcher = {

    async getDbDefinition(dbName: string) : Promise<DbDefinition> {
        let dbDef = await getDbDef(dbName);

        // Don' t provide secret
        delete dbDef.secret;

        return dbDef;
    },

    async getRecord(dbName:string, id:string) : Promise<Record> {
        let col = await Connection.getDbCol(dbName);
        let record = await col.findOne({_id: new ObjectId(id)});
        if (!record) throw new Error(`Missing db: ${dbName}`);
        return record;
    },

    async getRecords(dbName: string) : Promise<Record[]> {
        let col = await Connection.getDbCol(dbName);
        let cursor = await col.find();
        return cursor.toArray();
    }

}
