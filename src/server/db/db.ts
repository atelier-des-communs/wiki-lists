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

import {MongoClient, Db, ObjectId} from "mongodb";
import {Record} from "../../shared/model/instances";
import {_} from "../../shared/i18n/messages";
import {ValidationError} from "./exceptions";

const DB_HOST = "localhost";
const DB_NAME = "codata";
const DB_PORT = 27017;

const DATABASES_COL ="schemas";
const DATABASE_COL_TEMPLATE ="db.{name}";

const ATTRIBUTE_NAMES_PATTERN = /^[a-zA-Z0-9_\-]+$/;

/* Singleton instance */
class  Connection {
    static client : MongoClient = null;
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

interface DbSchema {
    name : string;
    schema: StructType;
}

export async function getSchema(dbName: string) : Promise<StructType> {
    let db = await Connection.getDb();
    let col = db.collection<DbSchema>(DATABASES_COL);
    let schema = await col.findOne({name: dbName});
    return schema.schema;
}

function validateSchema(schema:StructType) {
    for (let attr of schema.attributes) {
        if (empty(attr.name)) {
            throw new ValidationError(_.attribute_name_mandatory);
        }
        if (! ATTRIBUTE_NAMES_PATTERN.test(attr.name)) {
            throw new ValidationError(_.attribute_name_format);
        }
        if (!attr.type || !attr.type.tag) {
            throw new ValidationError(_.missing_type(attr.name));
        }
        switch(attr.type.tag) {
            case Types.ENUM :
                let type = attr.type as EnumType;
                if (!type.values || type.values.length == 0) {
                    throw new ValidationError(_.missing_enum_values(attr.name));
                }
        }
    }
}

export async function updateSchemaDb(dbName: string, schema:StructType) : Promise<StructType> {
    let db = await Connection.getDb();
    let col = db.collection<DbSchema>(DATABASES_COL);

    validateSchema(schema);

    for (let attr of schema.attributes) {
        attr.saved = true;
    }

    let result = await col.updateOne({name: dbName}, {$set : {schema:schema}});
    if (result.matchedCount != 1) {
        throw new Error(`db not found : ${dbName}`);
    }
    return schema;
}

export async function getAllRecordsDb(dbName: string) : Promise<Record[]> {
    let col = await Connection.getDbCol(dbName);
    let cursor = await col.find();
    return cursor.toArray();
}

export async function updateRecordDb(dbName: string, record : Record) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);

    let copy = { ...record} as any;
    copy._id = new ObjectId(record._id);
    let res = await col.replaceOne({_id: copy._id}, copy);
    if (res.matchedCount != 1) {
        throw Error(`No item matched for id : ${record._id}`);
    }
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


export async function createRecordDb(dbName: string, record : Record) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);
    if (record._id) {
        throw new Error("New records shouldnot have _id yet");
    }

    record._creationTime = new Date();

    let res = await col.insertOne(record);
    record._id = res.insertedId.toHexString();
    return record;
}
