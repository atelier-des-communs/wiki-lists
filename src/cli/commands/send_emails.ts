import {Connection, getRecordsByIds, NOTIFICATIONS_COLLECTION} from "../../server/db/db";
import {Record} from "../../shared/model/instances";
import {ICoord} from "../../shared/model/geo";
import {Map, updatedQuery} from "../../shared/utils";
import {viewPortToQuery} from "../../shared/jsx/pages/db/map";
import {RECORD_ZOOM} from "../../shared/jsx/components/edit-button";
import * as QueryString from "querystring";


function itemurl(item:Record) {
    let point = item["location"] as ICoord;
    let query : Map<any> = {};
    if (point) {
        query = viewPortToQuery({
            center: [point.lat, point.lon],
            zoom: RECORD_ZOOM
        });
    }
    query['popup']=item._id;
    return QueryString.stringify(query);
}


export async function send_emails(db_name:string) {
    let notifs = await Connection.getCollection(NOTIFICATIONS_COLLECTION);
    let cursor = notifs.find({});
    while(await cursor.hasNext()) {
        const notif = await cursor.next();
        try {
            notif.items = await getRecordsByIds(db_name, notif.items);
            console.log(notif.items.map((item: Record) => itemurl(item)));
        } catch (e) {
            console.error(`Error happened for ${notif.email} : ${e}`);
        }
    }
}