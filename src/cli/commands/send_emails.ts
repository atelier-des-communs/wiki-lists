import {
    Connection,
    getDbDef,
    getRecordsByIds,
    NOTIFICATIONS_COLLECTION, SSRDataFetcher,
    SUBSCRIPTIONS_COLLECTION
} from "../../server/db/db";
import {Record} from "../../shared/model/instances";
import {ICoord} from "../../shared/model/geo";
import {Map, mapValues, updatedQuery} from "../../shared/utils";
import {viewPortToQuery} from "../../shared/jsx/pages/db/map";
import {RECORD_ZOOM} from "../../shared/jsx/components/edit-button";
import * as QueryString from "querystring";
import {SimpleRecord} from "../../server/email/templates/definitions";
import {emailTemplates} from "../../server/email/templates";
import {Notification, Subscription} from "../../shared/model/notifications";
import {extractFilters, Filter, serializeFilters, TextFilter} from "../../shared/views/filters";
import {config, sharedConfig} from "../../server/config";
import {RECORDS_PATH} from "../../shared/api";
import {DbDefinition} from "../../shared/model/db-def";
import {manageURL} from "../../server/rest/db";
import {sendMail} from "../../server/email/email";
import {CITY_ZOOM} from "../../shared/jsx/type-handlers/filters";


let RECORDS_URL = config.ROOT_URL + RECORDS_PATH(sharedConfig) + "/";

function positionParams(lat:number, lon:number, zoom:number) {
    return viewPortToQuery({
        center: [lat, lon],
        zoom});
}

function itemurl(item:Record, filters:Map<Filter>) {
    let point = item["location"] as ICoord;
    let query : Map<any> = serializeFilters(mapValues(filters));
    if (point) {
        query = {
            ...query,
            ...positionParams(point.lat, point.lon, RECORD_ZOOM)
        }
    }
    query['popup']=item._id;
    return RECORDS_URL + "?" + QueryString.stringify(query);
}

async function allUrl(dbDef:DbDefinition, filters:Map<Filter>, communeSearch:string) {

    // XXX request not required here : smell of bad design
    let dataFetcher = new SSRDataFetcher(null);
    let params = serializeFilters(mapValues(filters));

    // Use autocomplete for getting bounding box of results ... nasty
    let auto = await dataFetcher.autocomplete(
        config.SINGLE_BASE,
        "commune",
        communeSearch,
        true, true);

    if (auto.length > 0) {
        let auto0 = auto[0];
        let minlon : number = auto0.minlon;
        let minlat : number = auto0.minlat;
        let maxlon : number = auto0.maxlon;
        let maxlat : number = auto0.maxlat;
        let postParams = positionParams((minlat+maxlat)/2, (minlon+maxlon)/2, CITY_ZOOM);
        params = {
            ...params,
            ...postParams};
    } else {
        console.log("No boundaries found for : " + communeSearch)
    }

    return RECORDS_URL + "?" + QueryString.stringify(params);
}

function toSimpleRecord(record:Record, filters:Map<Filter>) : SimpleRecord{
    return {
        surface: record.superficie_locaux,
        link: itemurl(record, filters),
        addresse: record.adresse,
        name : record.nom,
        type: record.type
    }
}

export async function send_emails() {
    let dbName = config.SINGLE_BASE;

    let notifsCol = await Connection.getCollection<Notification>(NOTIFICATIONS_COLLECTION);
    let subsCol = await Connection.getCollection<Subscription>(SUBSCRIPTIONS_COLLECTION);

    let dbDef = await getDbDef(dbName);

    let cursor = notifsCol.find({sent:{$ne:true}});

    let res : Promise<any>[] = [];

    while(await cursor.hasNext()) {
        const notif = await cursor.next();
        let email:string = notif.email;
        try {

            let subscription = await subsCol.findOne({email})
            let records = await getRecordsByIds(dbName, notif.items);

            let filters = extractFilters(dbDef.schema, subscription.filters);

            let simpleRecords = records.map(record => toSimpleRecord(record, filters));
            let commune = (filters["commune"] as TextFilter).search;
            let linkToall = await allUrl(dbDef, filters, commune);

            let manageLink = manageURL(email);

            let mail = emailTemplates["fr-FR"].notification(commune, simpleRecords, manageLink, linkToall);

            res.push(sendMail(email, mail).then(() => {
                return notifsCol.updateOne({email}, {$set : {sent: true}});
            }).catch((e) => {
                console.error(`Error when sending mail to ${email}`, e);
            }));

        } catch (e) {
            console.error(`Error happened for ${email}`, e);
        }
    }

    return Promise.all(res);
}