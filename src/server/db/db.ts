import {Attribute, EnumType, StructType, TextType, Types} from "../../shared/model/types";
import {config} from "../config"
import {Collection, Logger, MongoClient} from "mongodb";
import {Record, withSystemAttributes} from "../../shared/model/instances";
import {validateSchemaAttributes} from "../../shared/validators/schema-validators";
import {dieIfErrors} from "../../shared/validators/validators";
import {validateRecord} from "../../shared/validators/record-validator";
import {Autocomplete, DataFetcher, Marker, SECRET_COOKIE} from "../../shared/api";
import {
    arrayToMap,
    debug,
    filterSingle,
    isIn,
    Map,
    mapFromKeys,
    mapFromValues,
    mapValues,
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
import {cache} from "../cache";
import {assign, cloneDeep, flatMap, has, includes, isEmpty} from "lodash";
import * as tilebelt from "tilebelt";
import {ApproxCluster} from "../../shared/model/geo";
import {Subscription} from "../../shared/model/notifications";
import {sendDataEvent} from "../notifications/alerts";
import {DataEventType} from "../notifications/events";
import * as HttpStatus from "http-status-codes";
import * as crypto from "crypto";


const SCHEMAS_COLLECTION = "schemas";
const DB_COLLECTION_TEMPLATE = (name:string) => `db.${name}`;
const DB_CACHE_COLLECTION_TEMPLATE = (name:string, attr_name:string) => DB_COLLECTION_TEMPLATE(name) + "." + attr_name;

// TODO rename to "subscriptions"
export const SUBSCRIPTIONS_COLLECTION = "alerts";
export const NOTIFICATIONS_COLLECTION = "notifications";

const MARKERS_PER_CLUSTER = 50;
const AUTOCOMPLETE_NUM = 10;

// Min zoom from which to separate approximate locations
const MIN_ZOOM_APPROX = 12

/* Singleton instance */
export class  Connection {
    static client : MongoClient;
    static async getDb() {
        if (!this.client) {
            Logger.setLevel("info");
            this.client = await MongoClient.connect(`mongodb://${config.DB_HOST}:${config.DB_PORT}/`);
        }
        return this.client.db(config.DB_NAME);
    }

    static async getCollection<T=any>(colName : string) {
        let db = await Connection.getDb();
        return db.collection<T>(colName);
    }

    // Returns mongo collection for the given Db name
    static async getDbCollection(dbName : string) {
        return Connection.getCollection(DB_COLLECTION_TEMPLATE(dbName));
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


export async function createOrUpdateRecordsDb(dbName: string, records : Record[], _:IMessages, createOnly:boolean=false, noNotif:boolean=false) : Promise<Record[]> {
    let col = await Connection.getDbCollection(dbName);
    let dbDef = await getDbDef(dbName);
    let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);

    // Validate input
    for (let record of records) {
        // Validate record
        dieIfErrors(validateRecord(record, dbDef.schema, _, true));
        record._updateTime = new Date();
    }

    // Enrich / prepare for insertion in DB
    records = records.map(record => toMongo(record, attrMap));
    let recordsById = mapFromValues(records, record => record._id);

    // Find existing records : only required for sending DataEvents
    let inputIds = records.map(_ => _._id).filter(id => id !== undefined);
    let existingRecords = await col.find({_id : {$in : inputIds}}).toArray();
    let existingRecordsById = mapFromValues(existingRecords, record => record._id);

    console.debug(`Existing records ${existingRecords.length}`);

    // Bulk update existing records
    if (!isEmpty(existingRecordsById) && !createOnly) {
        var bulk = col.initializeUnorderedBulkOp();
        for (let existingId in existingRecordsById) {
            let previousState = existingRecordsById[existingId];
            let nextState = recordsById[existingId];
            bulk
                .find({_id: existingId})
                .update({$set: nextState});

            // Send DataUpdate event
            if (!noNotif) {
                sendDataEvent({
                    type:DataEventType.UPDATE,
                    previousState : fromMongo(previousState, attrMap),
                    state: fromMongo(nextState, attrMap)
                })
            }
        }
        await bulk.execute();
    }

    // Generate _id for missing ones
    for (let record of records) {
        // Find existing records
        if (!record._id) {
            record._id = shortid.generate();
        }
    }

    let newRecords = records.filter(record => !has(existingRecordsById, record._id));
    console.debug(`New records ${newRecords.length}`);

    if (newRecords.length > 0) {
        var bulk = col.initializeUnorderedBulkOp();
        for (let record of newRecords) {
            bulk.insert(record);
            if (!noNotif) {
                sendDataEvent({
                    type: DataEventType.CREATE,
                    state: fromMongo(record, attrMap)
                })
            }
        }
        await bulk.execute();
    }

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

// Add or update definition of an alert
export async function updateSubscriptionDb(dbName: string, subscription:Subscription, secret:string) : Promise<boolean> {
    if (secret !== computeSecret(subscription.email)) {
        throw new HttpError(HttpStatus.UNAUTHORIZED, "wrong secret code");
    }
    return setSubscriptionDb(dbName, subscription);
}

export async function setSubscriptionDb(dbName: string, subscription:Subscription) : Promise<boolean> {
    let db = await Connection.getDb();

    let alertsCol = db.collection(SUBSCRIPTIONS_COLLECTION);
    await alertsCol.findOneAndUpdate({email:subscription.email},
        {$set : subscription},
        {upsert:true});
    return true;
}


// Add notification to the "queue" of emails to be sent later
export async function addNotificationDb(email:string, item:any) : Promise<boolean> {
    let db = await Connection.getDb();
    let alertsCol = db.collection(NOTIFICATIONS_COLLECTION);
    await alertsCol.findOneAndUpdate({email},
        {
            $setOnInsert : {email},
            $addToSet : {items:item}},
        {upsert:true});
    return true;
}

export async function getActiveSubscriptionsDb() : Promise<Subscription[]> {
    let db = await Connection.getDb();
    let subscriptionsDb = db.collection<Subscription>(SUBSCRIPTIONS_COLLECTION);
    // Find all
    return await subscriptionsDb.find({disabled:{$ne:true}}).toArray();
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

const APPROX_HASH = "approx";

/**
 * List all fields to be fetched from mongo
 * @param attributes Attributes to fetch : all by default
 */
function projectFields(schema: StructType, attributes: string[] = null) {
    let attrs = schema.attributes;
    if (attributes != null) {
        attrs = attrs.filter(attr =>  includes(attributes, attr.name));
    }
    let cols = flatMap(attrs, attr => attr.type.selectColumns(attr.name));

    // {fieldName1: true, fieldName2: true, etc}
    return mapFromKeys(cols, col => true);
}

export async function getRecordsByIds(dbName:string, ids:string[]) : Promise<Record[]>{

    let col = await Connection.getDbCollection(dbName);
    let dbDef = await getDbDef(dbName);
    let project = projectFields(dbDef.schema);

    let records = await col.find<Record>({_id: {$in : ids}}, {projection:project}).toArray();

    let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);

    return records.map(record => fromMongo(record, attrMap));
}

// DataFetcher for SSR : direct access to DB
export class SSRDataFetcher implements DataFetcher {

    request : Request;

    constructor(request: Request) {
        this.request = request;
    }

    async getDbDefinition(dbName: string) : Promise<DbDefinition> {

        let dbDef = await getDbDef(dbName);

        // Decorate Db with user rights
        // XXX Should not be done here
        let pass = this.request.cookies[SECRET_COOKIE(dbName)];
        dbDef.userRights = await getAccessRights(dbName, pass);

        // Remove secret for non admins
        // TODO : FIXME dangerous ...
        if (!isIn(dbDef.userRights, AccessRight.ADMIN)) {
            delete dbDef.secret;
        }

        return dbDef;
    }

    @cache
    async getRecord(dbName:string, id:string) : Promise<Record> {
        let res = await getRecordsByIds(dbName, [id]);
        if (res.length == 0) {
            return null;
        }
        return res[0];
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
        let dbDef = await getDbDef(dbName);
        let query = this.baseQuery(dbName, filters, search);

        let project = projectFields(dbDef.schema);

        let cursor = col.find(query, {projection: project});

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
        let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);
        let records = await cursor.toArray();

        return records.map(record => fromMongo(record, attrMap))
    };


    @cache
    async getRecordsGeo(dbName: string,
                        zoom:number,
                        filters?: Map<Filter>,
                        search?:string,
                        extraFields:string[]=[]) : Promise<Marker[]>
    {
        let col = await Connection.getDbCollection(dbName);
        let dbDef = await getDbDef(dbName);
        let query = this.baseQuery(dbName, filters, search);

        let attrMap = arrayToMap(dbDef.schema.attributes, attr => attr.name);

        let locFilters = mapValues(filters).filter(filter => filter instanceof LocationFilter);
        if (locFilters.length != 1) {
            throw new BadRequestException("Should request 1 location filter, not " + locFilters.length)
        }

        let locFilter : LocationFilter = locFilters[0] as LocationFilter;

        let locAttr = locFilter.attr.name;

        let subStrExpr = {
            "$substr": [
                "$location.properties.hash",
                // Group geohash (slice) by 3 levels smaller than current zoom
                // We do that as workaround to limit number of records,
                // since we cannot "slice" the $push command at $group step (yet ...)
                0, zoom + 3]};

        // Above a given zoom, we split approx location into a separate group
        let approxLocExpr = {
            $cond : {
                if : "$loc_approx",
                then: APPROX_HASH,
                else: subStrExpr
            }
        }

        let project = {
            _id: 1,
            "geohash": (zoom >= MIN_ZOOM_APPROX) ? approxLocExpr : subStrExpr,
            "record._id": "$_id",
            ["record." + locAttr] : "$" + locAttr,
        };

        // FIXME security issue : filter fields upon user rights
        let fields  = projectFields(dbDef.schema, extraFields);
        for (let field in fields) {
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

        let res =  flatMap(clusters, function (cluster) : Marker {
            if (cluster._id == APPROX_HASH) {
                return {
                    approx:true,
                    count : cluster.count
                } as ApproxCluster
            } else if (cluster.count <= MARKERS_PER_CLUSTER) {
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

        console.debug("Markers", res);
        return res;
    }


    @cache
    async countRecords(dbName: string, filters: Map<Filter> = {}, search:string=null) : Promise<number> {
        let col = await Connection.getDbCollection(dbName);
        let query = this.baseQuery(dbName, filters);
        let cursor = col.find(query);
        return cursor.count();
    }


    @cache
    async getSubscription(email: string, secret:string): Promise<Subscription> {

        if (secret !== computeSecret(email)) {
            console.log("Bad secret", secret, computeSecret(email));
            throw new HttpError(HttpStatus.UNAUTHORIZED, "wrong secret code");
        }

        let col : Collection<Subscription> = await Connection.getCollection(SUBSCRIPTIONS_COLLECTION);
        let res = await col.findOne({email:email});
        delete (res as any)._id;
        return res;
    }

    @cache
    async autocomplete(dbName: string, attrName: string, query: string, geo:boolean=false, exact=false): Promise<Autocomplete[]> {
        let col = await Connection.getDbCollection(dbName);
        let dbDef = await getDbDef(dbName);

        if (!query || query.length < 3) {
            throw new BadRequestException('Query too small : 3 chars min');
        }

        let attr =  filterSingle(dbDef.schema.attributes, attr => attr.name == attrName);
        if (!attr || attr.type.tag != Types.TEXT || (attr.type as TextType).rich) {
            throw new BadRequestException(`${attr} is not a simple text field`);
        }

        // Split and simplify words
        let match:Map<any> = null;
        if (exact) {
            match = {_id: query};
        }else {
            let searchWords = query.split(" ").map((val) => slug(val));
            let matchExprs = searchWords.map((word) => ({
                [attrName + "$"]: {
                    $regex: `^${word}.*`
                }
            }));

            // AND for several words
            match = matchExprs.length == 1 ? matchExprs[0] : {$and: matchExprs}
        }

        console.debug("Match expression", match);

        // Cache collection exists for auto complete ?
        let db = await Connection.getDb();
        let cacheColName = DB_CACHE_COLLECTION_TEMPLATE(dbName, attrName);

        if (!(await hasCollection(cacheColName))) {

            console.debug("Cache collection not found : creating it")

            // Group result : count them
            let groupInstruction: Map<any> = {
                _id: "$" + attrName,
                "count": {$sum: 1},
                [attrName + "$"]: {$first: "$" + attrName + "$"}
            };

            // FIXME : We force computation of geo info in order to have it in cache
            // FIXME : location attr name hardcoded
            groupInstruction["minlon"] = {$min: {$arrayElemAt: ["$location.coordinates", 0]}};
            groupInstruction["maxlon"] = {$max: {$arrayElemAt: ["$location.coordinates", 0]}};
            groupInstruction["minlat"] = {$min: {$arrayElemAt: ["$location.coordinates", 1]}};
            groupInstruction["maxlat"] = {$max: {$arrayElemAt: ["$location.coordinates", 1]}};


            await col.aggregate([
                {$group: groupInstruction},
                {$out: cacheColName}]).toArray();

            await db.collection(cacheColName).createIndex({[attrName + "$"] : 1});
        }

        let res = db.collection(cacheColName).aggregate([
            {$match:match},
            {$sort : {count: -1}},
            {$limit: AUTOCOMPLETE_NUM}]);

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

    updateSubscription(dbName: string, subscription: Subscription, secret: string): Promise<boolean> {
        return updateSubscriptionDb(dbName, subscription, secret);
    }
}

export async function clearCacheCollections(dbName : string) {
    let dbDef = await getDbDef(dbName);
    for (let attr of dbDef.schema.attributes) {
        let collectionName = DB_CACHE_COLLECTION_TEMPLATE(dbName, attr.name);
        if (await hasCollection(collectionName)) {
            console.warn(`Removing cache collection : ${collectionName}`)
            let col = await Connection.getCollection(collectionName);
            await col.drop();
        }
    }
}

async function hasCollection(collectionName:string) {
    let db = await Connection.getDb();
    return (await db.listCollections({name: collectionName}).next()) != null;
}



export function computeSecret(email:string) {
    return crypto.createHash('sha256').update(JSON.stringify(email + "#" + config.SECRET)).digest('hex')
}

