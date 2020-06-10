import {
    Connection,
    getDbDef,
    getRecordsByIds,
    NOTIFICATIONS_COLLECTION,
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


let RECORDS_URL = config.ROOT_URL + RECORDS_PATH(sharedConfig) + "/";

function itemurl(item:Record, filters:Map<Filter>) {
    let point = item["location"] as ICoord;

    let query : Map<any> = serializeFilters(mapValues(filters));
    if (point) {
        query = {...query, ...viewPortToQuery({
            center: [point.lat, point.lon],
            zoom: RECORD_ZOOM
        })};
    }
    query['popup']=item._id;
    return RECORDS_URL + "?" + QueryString.stringify(query);
}

function allUrl(dbDef:DbDefinition, filters:Map<Filter>) {
    let params = QueryString.stringify(serializeFilters(mapValues(filters)));
    return RECORDS_URL + "?" + params;
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

export async function send_emails(db_name:string) {

    let notifsCol = await Connection.getCollection<Notification>(NOTIFICATIONS_COLLECTION);
    let subsCol = await Connection.getCollection<Subscription>(SUBSCRIPTIONS_COLLECTION);
    let dbDef = await getDbDef(db_name);

    let cursor = notifsCol.find({sent:{$ne:true}});

    let res : Promise<any>[] = [];

    while(await cursor.hasNext()) {
        const notif = await cursor.next();
        let email:string = notif.email;
        try {

            let subscription = await subsCol.findOne({email})
            let records = await getRecordsByIds(db_name, notif.items);

            let filters = extractFilters(dbDef.schema, subscription.filters);

            let simpleRecords = records.map(record => toSimpleRecord(record, filters));
            let linkToall = allUrl(dbDef, filters);
            let commune = (filters["commune"] as TextFilter).search;

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