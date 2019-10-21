import {Attribute, EnumType, StructType, TextType, Types} from "../../shared/model/types";
import {config} from "../config"
import {MongoClient, Cursor} from "mongodb";
import {Record, withSystemAttributes} from "../../shared/model/instances";
import {validateSchemaAttributes} from "../../shared/validators/schema-validators";
import {dieIfErrors, ValidationException} from "../../shared/validators/validators";
import {validateRecord} from "../../shared/validators/record-validator";
import {Autocomplete, AUTOCOMPLETE_URL, DataFetcher, Marker, SECRET_COOKIE} from "../../shared/api";
import {
    arrayToMap,
    buildMap,
    debug,
    filterSingle,
    isIn,
    Map,
    mapMap,
    mapValues,
    oneToArray,
    slug
} from "../../shared/utils";
import {IMessages} from "../../shared/i18n/messages";
import {AccessRight} from "../../shared/access";
import {getAccessRights} from "../utils";
import {Request} from "express-serve-static-core"
import * as shortid from "shortid";
import {DbDefinition} from "../../shared/model/db-def";
import {Filter, LocationFilter} from "../../shared/views/filters";
import {ISort} from "../../shared/views/sort";
import {toTypedObjects} from "../../shared/serializer";
import {BadRequestException, HttpError} from "../exceptions";
import {flatMap} from "lodash";
import {cache} from "../cache";
import {cloneDeep, assign, isEmpty} from "lodash";
import * as tilebelt from "tilebelt";

const SCHEMAS_COLLECTION = "schemas";
const DB_COLLECTION_TEMPLATE = (name:string) => {return `db.${name}`};
const ALERTS_COLLECTION = "alerts";

const MARKERS_PER_CLUSTER = 20;
const AUTOCOMPLETE_NUM = 10;

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
        res = assign(res, attrMap[key].type.toMongo(key, record[key]));
    }
    return res;
}

// Transform data after load
function fromMongo(record : Record, attrMap: Map<Attribute>) {

    let res : any = {};

    // Loop on keys
    for (let key in attrMap) {
        let attr = attrMap[key];
        if (key in record) {
            res[key] = attr.type.fromMongo(record[key]);
        }
    }
    return res;
}

export async function setUpIndexesDb(dbName: string) {
    let col = await Connection.getDbCollection(dbName);
    let dbDef = await getDbDef(dbName);

    let textIndex : Map<string> = {};

    // Extract text index to single index with all text fields
    for (let attr of dbDef.schema.attributes) {

        let indexes = attr.type.mongoIndex(attr.name);

        for (let key in indexes) {
            let index = indexes[key];
            if (index == "text") {
                // Tet indexes are merged into a single index
                textIndex[key] = index;
            } else {

                let res= await col.createIndex({[key]:index});
                console.info(`Creating index for attr : ${attr.name}`, key, index, `res : ${res}`);
            }
        }
    }

    if (!isEmpty(textIndex)) {
        await col.createIndex(textIndex, {"name" : "text_index"});
    }
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

        if (!record._id) {
            record._id = shortid.generate();
        }
        record._updateTime = new Date();
    }

    let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);
    records = records.map(record => toMongo(record, attrMap));

    var bulk = col.initializeUnorderedBulkOp();
    for (let record of records) {
        bulk
            .find({_id: record._id})
            .upsert().update(
                {
                    $set: record,
                    $setOnInsert: {_creationTime: new Date()}});
    }
    await bulk.execute();
    if (records.length == 1) {
        return records.map(record => fromMongo(record, attrMap));
    } else {
        return []
    }
}

export async function deleteRecordDb(dbName: string, id : string) : Promise<boolean> {
    let col = await Connection.getDbCollection(dbName);
    let res = await col.deleteOne({_id : id});
    if (res.deletedCount != 1) {
        throw Error(`No record deleted with id: ${id}`);
    }
    return true;
}

export async function addAlertDb(dbName: string, email:string, filters:Map<string>) : Promise<boolean> {
    let db = await Connection.getDb();
    let alertsCol = db.collection(ALERTS_COLLECTION);
    await alertsCol.findOneAndUpdate({email},
        {$set : {email, filters}},
        {upsert:true});
    return true;
}

export async function checkAvailability(dbName:string) : Promise<boolean> {
    let db = await Connection.getDb();
    let col = db.collection<DbDefinition>(SCHEMAS_COLLECTION);
    let database = await col.findOne({name: dbName});
    return (database == null);
}

// Local cache of Schemas
// FIXME : solve the serailization issue for Schemas and use Redis cache
// FIXME : Update cache upon update
const SCHEMAS_CACHE : Map<DbDefinition> = {};


export async function getDbDef(dbName: string) : Promise<DbDefinition> {

    if (dbName in SCHEMAS_CACHE) {
        return cloneDeep(SCHEMAS_CACHE[dbName]);
    }

    let db = await Connection.getDb();
    let schemas = db.collection<DbDefinition>(SCHEMAS_COLLECTION);
    let schema = await schemas.findOne({name: dbName});

    if (!schema) throw new HttpError(404, `Missing schema: ${dbName}`);

    // FIXME: Should be saved as @class in mongo as well
    let res = toTypedObjects(schema, "tag", false);

    res.schema = withSystemAttributes(res.schema);

    SCHEMAS_CACHE[dbName] = res;

    return cloneDeep(res);
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


        console.debug("Input filters", JSON.stringify(filters))

        // Build mongo filters
        let mongoFilters = mapValues(filters).map(f => f.mongoFilter()).filter(f => f !== null);

        if (search) {
            // Eech word need to be quoted for AND behavior
            let words = search.split(" ");
            let quotedSearch = words.map(word => '\"' + word + '\"').join(" ");
            console.debug("quoted search", quotedSearch);
            mongoFilters.push({$text: {$search: quotedSearch}});
        }

        if (mongoFilters.length == 1) {
            return mongoFilters[0]
        } else if (mongoFilters.length >= 1) {
            return {$and : mongoFilters}
        } else {
            return {};
        }
    }

    @cache
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


    @cache
    async getRecordsGeo(dbName: string,
                        zoom:number,
                        filters?: Map<Filter>,
                        search?:string,
                        extraFields:string[]=[]) : Promise<Marker[]>
    {
        let col = await Connection.getDbCollection(dbName);
        let dbDef = await this.getDbDefinition(dbName);
        let query = this.baseQuery(dbName, filters, search);

        let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);

        let locFilters = mapValues(filters).filter(filter => filter instanceof LocationFilter);
        if (locFilters.length != 1) {
            throw new BadRequestException("Should request 1 location filter, not " + locFilters.length)
        }

        let locFilter : LocationFilter = locFilters[0] as LocationFilter;

        let locAttr = locFilter.attr.name;

        let project = {
            _id: 1,
            "geohash": {
                "$substr": [
                    "$location.properties.hash",
                    // Slice current records geohash for required length
                    0, zoom + 3]
            },
            "record._id": "$_id",
            ["record." + locAttr] : "$" + locAttr,
        };

        // FIXME security issue : filter fields upon user rights
        for (let field of extraFields) {
            project["record." + field] = "$" + field;
        }

        debug("location", locFilter, "\nquery", JSON.stringify(query));

        // We group twice because $slice is not avail on $group stage
        // and gathering all records for each group may exceed RAM
        // We use "$first" for single records and then group again at higher scale for having several samples in a group
        let cursor = col.aggregate([
            {$match: query},
            {
                $project: project
            },
            {
                $group: {
                    _id: "$geohash",
                    "count": {
                        $sum: 1
                    },
                    "record": {$first: "$record"},
                }
            },{
                $group: {
                    _id : {"$substr": ["$_id", 0, zoom]},
                    "count": {$sum:"$count"},
                    "records" :  { $push : "$record"}
                }
            }, {
                $project: {
                    _id : "$_id",
                    "records" : {$slice : ["$records", MARKERS_PER_CLUSTER]},
                    "count" : "$count"
                }
            }
        ]);

        // console.debug("Explain", JSON.stringify(await cursor.explain(), null, 4));

        let clusters = await cursor.toArray();

        // debug("clusters", clusters);
        debug("Parsed nb records ", clusters.map(cluster => cluster.records.length).reduce((a, b) => a+b, 0));

        return flatMap(clusters, function (cluster) : Marker {
            if (cluster.count <= MARKERS_PER_CLUSTER) {
                return cluster.records.map((record : Record) => fromMongo(record, attrMap));
            } else {
                // Cluster id is the hash
                let tile = tilebelt.quadkeyToTile(cluster._id);
                let box = tilebelt.tileToBBOX(tile);
                let lon = (box[0] + box[2]) / 2;
                let lat = (box[1] + box[3]) / 2;
                return [{
                    lat, lon,
                    count : cluster.count
                }]
            }
        })
    }

    @cache
    async countRecords(dbName: string, filters: Map<Filter> = {}, search:string=null) : Promise<number> {
        let col = await Connection.getDbCollection(dbName);
        let query = this.baseQuery(dbName, filters);
        let cursor = col.find(query);
        return cursor.count();
    }

    @cache
    async autocomplete(dbName: string, attrName: string, query: string, geo:boolean=false): Promise<Autocomplete[]> {
        let col = await Connection.getDbCollection(dbName);
        let dbDef = await this.getDbDefinition(dbName);

        if (!query || query.length < 3) {
            throw new BadRequestException('Query too small : 3 chars min');
        }

        let attr =  filterSingle(dbDef.schema.attributes, attr => attr.name == attrName);
        if (!attr || attr.type.tag != Types.TEXT || (attr.type as TextType).rich) {
            throw new BadRequestException(`${attr} is not a simple text field`);
        }

        // Split and simplify words
        let searchWords = query.split(" ").map((val) => slug(val));
        let matchExprs = searchWords.map((word) => ({
            [attrName + "$"] : {$regex : `^${word}.*`
        }}));

        // AND for several words
        let match = matchExprs.length == 1 ? matchExprs[0] : {$and: matchExprs}

        console.debug("Match expression", match)

        let groupExpr : any = {
            _id: "$" + attrName,
            "count": {$sum: 1}};
        if (geo) {
            groupExpr = {...groupExpr,
                "minlon" : {$min : {$arrayElemAt : ["$location.coordinates", 0]}},
                "maxlon" : {$max : {$arrayElemAt : ["$location.coordinates", 0]}},
                "minlat" : {$min : {$arrayElemAt : ["$location.coordinates", 1]}},
                "maxlat" : {$max : {$arrayElemAt : ["$location.coordinates", 1]}}
            }
        }

        // Cache collection exists for auto complete ?
        let db = await Connection.getDb();
        let cacheColName = DB_COLLECTION_TEMPLATE(dbName) + '.' + attrName;
        let cacheCol = await db.listCollections({name: cacheColName}).next();
        let res;
        if (cacheCol) {
            console.debug(`${cacheColName}  found : using cache collection for autocomplete`)
            res = db.collection(cacheColName).aggregate([
                {$match:match},
                {$sort : {count: -1}},
                {$limit: AUTOCOMPLETE_NUM}]);
        } else {
            console.debug(`${cacheColName} not found : using regular collection for autocomplete`)
             res = col.aggregate([
                {$match:match},
                {$group: groupExpr},
                {$sort : {count: -1}},
                {$limit: AUTOCOMPLETE_NUM}
            ]);
        }

        return (await res.toArray()).map((item) => {
            let res : Autocomplete = {
                value : item._id,
                score: item.count}
            if (geo) {
                res =
                    {...res,
                    minlon: item.minlon,
                    maxlon: item.maxlon,
                    minlat: item.minlat,
                    maxlat: item.maxlat}
            }
            return res;
        });
    }
}
