import {Rule, RuleEngine} from "./rules/rule-engine";
import {addNotificationDb, getDbDef, getActiveSubscriptionsDb} from "../db/db";
import {config} from "../config";
import {extractFilters} from "../../shared/views/filters";
import {DataEvent} from "./events";
import {registerJobHandler, sendJob} from "../jobs/jobs";

export const DATA_EVENT_JOB_NAME = "dataEvent";

// Fetch alerts definition from DB
async function buildAlertRuleEngine() : Promise<RuleEngine> {
    let dbDef = await getDbDef(config.SINGLE_BASE);
    let subscriptions = await getActiveSubscriptionsDb();

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

class RuleEngineBuilder {

    private engineMs: number = null;
    private engine: RuleEngine = null;

    constructor() {
        // warmup
        this.getRuleEngine();
        console.log("RULE_ENGINE_TTL", config.RULE_ENGINE_TTL)
    }

    async getRuleEngine() {
        let now = Date.now();
        if (!this.engineMs || (now - this.engineMs) > config.RULE_ENGINE_TTL * 1000) {
            this.engine = await buildAlertRuleEngine();
            this.engineMs = now;
            console.info(`Rule engine build with ${this.engine.rules.length} alert definitions`);
        }
        return this.engine;
    }
}


// Job for consuming data events in stream
export async function setupAlertHandler() {

    let ruleEngineBuilder = new RuleEngineBuilder()
    registerJobHandler(DATA_EVENT_JOB_NAME, (data:DataEvent) => {
        ruleEngineBuilder.getRuleEngine().then((engine) => {
            engine.fire(data);
        });

    });
}

