import {Attribute, EnumType, StructType, Types} from "../../shared/model/types";
import config from "../config"
import {MongoClient, Cursor} from "mongodb";
import {Record, withSystemAttributes} from "../../shared/model/instances";
import {validateSchemaAttributes} from "../../shared/validators/schema-validators";
import {BadRequestException, dieIfErrors, ValidationException} from "../../shared/validators/validators";
import {validateRecord} from "../../shared/validators/record-validator";
import {DataFetcher, SECRET_COOKIE} from "../../shared/api";
import {arrayToMap, isIn, Map, mapMap, mapValues} from "../../shared/utils";
import {IMessages} from "../../shared/i18n/messages";
import {AccessRight} from "../../shared/access";
import {getAccessRights, HttpError} from "../utils";
import {Request} from "express-serve-static-core"
import * as shortid from "shortid";
import {DbDefinition} from "../../shared/model/db-def";
import {Filter, LocationFilter} from "../../shared/views/filters";
import {ISort} from "../../shared/views/sort";
import {toTypedObjects} from "../../shared/serializer";
import {Cluster} from "../../shared/model/geo";
import {encode as geohash} from "ngeohash";

const SCHEMAS_COLLECTION = "schemas";
const DB_COLLECTION_TEMPLATE = (name:string) => {return `db.${name}`};

/* Singleton instance */
class  Connection {
    static client : MongoClient;
    static async getDb() {
        if (!this.client) {
            this.client = await MongoClient.connect(`mongodb://${config.DB_HOST}:${config.DB_PORT}/`);
        }
        return this.client.db(config.DB_NAME);
    }

    // Retuens mongo collection for the given Db name
    static async getDbCollection(dbName : string) {
        let db = await Connection.getDb();
        return db.collection(DB_COLLECTION_TEMPLATE(dbName));
    }
}


// Create collections / indexes
async function init() : Promise<void> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(SCHEMAS_COLLECTION);
    col.createIndex(
        {"name": 1},
        { unique: true });
}

// Part of Db Settings that can be overriden
export async function updateSchemaDb(dbName: string, schema:StructType, _:IMessages) : Promise<StructType> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(SCHEMAS_COLLECTION);

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
    let col = db.collection<DbDefinition>(SCHEMAS_COLLECTION);

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


// Transform data before insert to mongo
function toMongo(record : Record, attrMap: Map<Attribute>) {

    let res : any = {};

    // Loop on keys
    for (let key in record) {
        let attr = attrMap[key];
        res[key] = attr.type.toMongo(record[key]);
    }
    return res;
}

// Transform data after load
function fromMongo(record : Record, attrMap: Map<Attribute>) {

    let res : any = {};

    // Loop on keys
    for (let key in record) {
        let attr = attrMap[key];
        res[key] = attr.type.fromMongo(record[key]);
    }
    return res;
}

export async function updateRecordDb(dbName: string, record : Record, _:IMessages) : Promise<Record> {
    let col = await Connection.getDbCollection(dbName);
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



export async function createRecordsDb(dbName: string, records : Record[], _:IMessages) : Promise<Record[]> {
    let col = await Connection.getDbCollection(dbName);
    let dbDef = await getDbDef(dbName);



    for (let record of records) {

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
    }

    let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);
    records = records.map(record => toMongo(record, attrMap));

    let res = await col.insertMany(records);

    return records.map(record => fromMongo(record, attrMap));
}

export async function deleteRecordDb(dbName: string, id : string) : Promise<boolean> {
    let col = await Connection.getDbCollection(dbName);
    let res = await col.deleteOne({_id : id});
    if (res.deletedCount != 1) {
        throw Error(`No record deleted with id: ${id}`);
    }
    return true;
}

export async function checkAvailability(dbName:string) : Promise<boolean> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(SCHEMAS_COLLECTION);
    let database = await col.findOne({name: dbName});
    return (database == null);
}

export async function getDbDef(dbName: string) : Promise<DbDefinition> {

    let db = await Connection.getDb();
    let schemas = db.collection<DbDefinition>(SCHEMAS_COLLECTION);
    let schema = await schemas.findOne({name: dbName});

    if (!schema) throw new HttpError(404, `Missing schema: ${dbName}`);

    // FIXME: Should be saved as @class in mongo as well
    let res = toTypedObjects(schema, "tag", false);

    res.schema = withSystemAttributes(res.schema);

    console.log(JSON.stringify(res, null, "  "))

    return res;
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
        let col = await Connection.getDbCollection(dbName);
        let dbDef = await getDbDef(dbName);

        let record = await col.findOne({_id: id});

        if (!record) throw new Error(`Missing record with id: ${id}`);

        let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);

        return fromMongo(record, attrMap);
    }

    baseQuery(dbName: string, filters: Map<Filter> = {}, search:string=null) : {} {

        // Build mongo filters
        let mongoFilters = mapValues(filters).map(f => f.mongoFilter()).filter(f => f !== null);
        let filter:{} = null;

        if (mongoFilters.length == 1) {
            filter = mongoFilters[0]
        } else if (mongoFilters.length >= 1) {
            filter = {$and : mongoFilters}
        }

        // TODO : add text search

        return filter
    }

    async getRecords(
        dbName: string,
        filters: Map<Filter> = {},
        search:string=null,
        sort:ISort,
        from:number=null,
        limit:number=null) : Promise<Record[]>
    {
        let col = await Connection.getDbCollection(dbName);
        let dbDef = await this.getDbDefinition(dbName);
        let query = this.baseQuery(dbName, filters, search);

        let cursor = col.find(query);

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
        let records = await cursor.toArray();
        let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);

        return records.map(record => fromMongo(record, attrMap))
    }



    async getRecordsGeo(dbName: string,
                        filters?: Map<Filter>,
                        search?:string,
                        sort?: ISort) : Promise<(Record | Cluster)[]>
    {
        let col = await Connection.getDbCollection(dbName);
        let query = this.baseQuery(dbName, filters, search);

        let locFilters = mapValues(filters).filter(filter => filter instanceof LocationFilter);
        if (locFilters.length != 1) {
            throw new BadRequestException("Should request 1 location filter, not " + locFilters.length)
        }

        let locFilter : LocationFilter = locFilters[0] as LocationFilter;
        let hash1 = geohash(locFilter.minlat, locFilter.minlon);
        let hash2 = geohash(locFilter.maxlat, locFilter.maxlon);

        let commonLength = 0;
        for (commonLength = 0; commonLength < hash1.length; commonLength++) {
            if (hash1[commonLength] !== hash2[commonLength]) break;
        }

        const SUB_PRECISION = 3;

        let cursor = col.aggregate([{$match: query},
            {
                $project: {
                    _id: 1,
                    "geohash": {
                        "$substr": [
                            "$location.properties.hash",
                            // Slice current records geohash for required length
                            0, commonLength + SUB_PRECISION]
                    },
                    "properties": 1,
                    "location": 1

                }
            },

            {
                $group: {
                    _id: "$geohash",
                    "count": {
                        $sum: 1
                    },
                    "items": {
                        $push: {
                            coordinates: "$location"
                        }
                    }
                }
            }]);
        return cursor.toArray();
    }

    async countRecords(dbName: string, filters: Map<Filter> = {}, search:string=null) : Promise<number> {
        let col = await Connection.getDbCollection(dbName);
        let query = this.baseQuery(dbName, filters);
        let cursor = col.find(query);
        return cursor.count();
    }

}
