import {applyFilters, extractFilters, IFilter} from "../../../shared/views/filters";
import {DataEventType, DataEvent} from "../events";
import {Map} from "../../../shared/utils";
import {Record} from "../../../shared/model/instances";


export class Rule {
    filters: Map<IFilter<any>>;
    then: (match:Record) => void;

    constructor(filters:Map<IFilter<any>>, then: (match:Record)=> void) {
        this.filters = filters;
        this.then = then;
    }

    fire(event: DataEvent)  {
        if (event.type == DataEventType.UPDATE) {
            let before = applyFilters(event.previousState, this.filters);
            let after = applyFilters(event.state, this.filters);
            if (!before && after) {
                this.then(event.state);
            }
        } else if (event.type == DataEventType.CREATE) {
            if (applyFilters(event.state, this.filters)) {
                this.then(event.state)
            }
        } else {
            throw Error("Unknown event type");
        }
    }
}

export class RuleEngine {
    rules: Rule[];

    constructor(rules: Rule[]) {
        this.rules = rules;
    }

    fire(event : DataEvent) {
        for (let rule of this.rules) {
            rule.fire(event);
        }
    }
}

