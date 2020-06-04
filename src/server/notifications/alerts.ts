import {Rule, RuleEngine} from "./rules/rule-engine";
import {addNotificationDb, getDbDef, getSubscriptionsDb} from "../db/db";
import {config} from "../config";
import {extractFilters} from "../../shared/views/filters";
import {DataEvent} from "./events";
import {registerJobHandler, sendJob} from "../jobs/jobs";

export const DATA_EVENT_JOB_NAME = "dataEvent";

// Fetch alerts definition from DB
async function buildAlertRuleEngine() : Promise<RuleEngine> {
    let dbDef = await getDbDef(config.SINGLE_BASE);
    let subscriptions = await getSubscriptionsDb();

    let rules = subscriptions.map(alert => {
        // Filters are stored as query params
        let filters = extractFilters(dbDef.schema, alert.filters);
        return new Rule(filters, (record) => {
            // In case of match, add this to notifications to be sent
            addNotificationDb(alert.email, record._id);
        });
    });

    return new RuleEngine(rules);
}




// Send data update asynchronously to kue
export function sendDataEvent(event: DataEvent) {
    sendJob(DATA_EVENT_JOB_NAME, event);
}

// Job for consuming data events in stream
export async function setupAlertHandler() {

    // FIXME : Only built once : should be updated regularly
    let engine = await buildAlertRuleEngine();

    console.info(`Rule engine build with ${engine.rules.length} alert definitions`);

    registerJobHandler(DATA_EVENT_JOB_NAME, (data:DataEvent) => {
        engine.fire(data);
    });
}

