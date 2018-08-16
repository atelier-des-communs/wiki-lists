import {StructType, BooleanType, Type, NumberType, Attribute, TextType} from "../../shared/model/types";
import {IState} from "../../shared/redux";
import {Map} from "../../shared/utils";

import {MongoClient, Db, ObjectId} from "mongodb";
import {Record} from "../../shared/model/instances";

const DB_HOST = "localhost";
const DB_NAME = "codata";
const DB_PORT = 27017;

const DATABASES_COL ="schemas";
const DATABASE_COL_TEMPLATE ="db.{name}";


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


function firstSchema() {
    let res = new StructType();
    res.attributes.push({name:"boolean", type:new BooleanType()});
    res.attributes.push({name:"text", type:new TextType()});
    res.attributes.push({name:"number", type:new NumberType()});
    return res;
}

export async function getSchema(dbName: string) : Promise<StructType> {
    let db = await Connection.getDb();
    let col = db.collection<DbSchema>(DATABASES_COL);
    let schema = await col.findOne({name: dbName});
    if (schema == null) {
        await col.insertOne({name: dbName, schema: firstSchema});
        return firstSchema();
    } else {
        return schema.schema;
    }
}

export async function getAllRecords(dbName: string) : Promise<Record[]> {
    let col = await Connection.getDbCol(dbName);
    let cursor = await col.find();
    return cursor.toArray();
}

export async function updateRecord(dbName: string, record : Record) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);

    let copy = { ...record} as any;
    copy._id = new ObjectId(record._id);
    let res = await col.replaceOne({_id: copy._id}, copy);
    if (res.matchedCount != 1) {
        throw Error(`No item matched for id : ${record._id}`);
    }
    return record;
}


export async function deleteRecord(dbName: string, id : string) : Promise<boolean> {
    let col = await Connection.getDbCol(dbName);
    let res = await col.deleteOne({"_id" : new ObjectId(id)});
    if (res.deletedCount != 1) {
        throw Error(`No record deleted with id: ${id}`);
    }
    return true;
}


export async function createRecord(dbName: string, record : Record) : Promise<Record> {
    let col = await Connection.getDbCol(dbName);
    if (record._id) {
        throw new Error("New records shouldnot have _id yet");
    }

    record._creationTime = new Date();

    let res = await col.insertOne(record);
    record._id = res.insertedId.toHexString();
    return record;
}
