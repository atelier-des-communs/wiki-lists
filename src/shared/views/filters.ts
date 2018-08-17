import {arrayToMap, empty, eqSet, isIn, Map, mapMap} from "../utils";
import {Attribute, attributesMap, EnumType, StructType, Types} from "../model/types";
import {Record} from "../model/instances";
// import normalize from "normalize-text";
import {applySort, extractSort} from "./sort";

const FILTER_PATTERN = `{attr}.f`;


// FIXME normalize seemsto break server
function normalize(value:string) {
    if (!value) {
        return "";
    } else {
        return value.toLowerCase();
    }
}

interface IFilter {
    attr:Attribute;
    serialize(): String;
    filter(value:any):boolean;
}

export class BooleanFilter implements IFilter {
    tag = Types.BOOLEAN;
    attr: Attribute;
    showTrue:boolean;
    showFalse:boolean;

    // No filter : accepting all
    constructor(attr:Attribute, queryValue: string = null) {
        this.attr = attr;
        if (queryValue == null) {
            this.showTrue = true;
            this.showFalse = true;
        } else {
            let values = queryValue.split(",");
            this.showTrue = isIn(values,"true");
            this.showFalse = isIn(values,"false");
        }
    }

    serialize() {
        if (this.showTrue && this.showFalse) {
            // Same as no filter
            return null;
        }
        let res = [];
        if (this.showTrue) {
            res.push('true');
        }
        if (this.showFalse) {
            res.push('false');
        }
        return res.join(",");
    }

    filter(value:any) {
        if (value) {
            return this.showTrue;
        } else {
            return this.showFalse;
        }
    }
}

export class TextFilter implements IFilter {
    tag = Types.TEXT;
    attr: Attribute;
    search: string;
    searchNorm : string;

    // No filter : accepting all
    constructor(attr:Attribute, queryValue: string = null) {
        this.attr = attr;
        if (empty(queryValue)) {
            this.search = null;
            this.searchNorm = null;
        } else {
            this.search = queryValue;
            this.searchNorm = normalize(queryValue);
        }
    }

    serialize() {
        if (!this.search) {
            // Same as no filter
            return null;
        }
        return this.search;
    }

    filter(value:any) {
        if (empty(this.search)) {
            return true;
        }
        if (empty(value)) {
            value = "";
        }
        let normVal = normalize(value);
        return normVal.indexOf(this.searchNorm) > -1;
    }
}

export class EnumFilter implements IFilter {
    tag = Types.ENUM;
    attr: Attribute;
    showValues:string[];
    showEmpty:boolean;

    // No filter : accepting all
    constructor(attr:Attribute, queryValue: string = null) {
        this.attr = attr;
        let allValues = this.allValues();
        if (queryValue == null) {
            // No filter = All values + empty
            this.showValues = allValues;
            this.showEmpty = true;
        } else {
            let queryValues = queryValue.split(",");
            this.showValues = allValues.filter(val => isIn(queryValues, val));
            this.showEmpty = isIn(queryValues, "empty");
        }
    }

    allValues(): string[] {
        let type = this.attr.type  as EnumType;
        return type.values.map(enumVal => enumVal.value);
    }

    isAll() {
        return this.showEmpty && eqSet(this.allValues(), this.showValues);
    }

    serialize() {
        if (this.isAll()) {
            // Same as no filter
            return null;
        }
        let res = [];
        if (this.showEmpty) {
            res.push("empty");
        }
        res = res.concat(this.showValues);
        return res.join(",");
    }

    filter(value:any) {
        if (typeof(value) == "undefined" || value == null) {
            return this.showEmpty;
        } else {
            return isIn(this.showValues, value);
        }
    }
}



export type Filter = BooleanFilter | EnumFilter | TextFilter;

/** Serialize to an object with single attribute, ready to be merged with queryParams */
export function serializeFilter(attrName:string, filter:Filter) {
    let val = filter ? filter.serialize() : null;
    let key = FILTER_PATTERN.replace("{attr}", attrName);
    return {[key] : val}
}

export function extractFilters(schema: StructType, queryParams: Map<any>) : Map<Filter> {
    var res : Map<Filter> = {};
    for(let attr of  schema.attributes) {
        let key = FILTER_PATTERN.replace("{attr}", attr.name);
        if (key in queryParams) {
            switch (attr.type.tag) {
                case Types.BOOLEAN :
                    res[attr.name] = new BooleanFilter(attr, queryParams[key]);
                    break;
                case Types.ENUM :
                    res[attr.name] = new EnumFilter(attr, queryParams[key]);
                    break;
                case Types.TEXT :
                    res[attr.name] = new TextFilter(attr, queryParams[key]);
                    break;
            }
        }
    }
    return res;
}


export function applySearch(records:Record[], search:string, schema:StructType) {
    let searchNorm = search ? normalize(search) : null;
    return records.filter(record => {
        if (empty(search)) {
            return true;
        }
        for (let attr of schema.attributes) {
            if (attr.type.tag == Types.TEXT) {
                let value = record[attr.name];
                let valueNorm = value ? normalize(value) : "";
                if (valueNorm.indexOf(searchNorm) > -1) {
                    return true;
                }
            }
        }
        return false;
    });
}

export function parseSearch(queryParams:Map<string>) {
    return queryParams["q"];
}

export function serializeSearch(search:string) {
    return {q: search}
}


export function applyFilters(records: Record[], filters : Map<Filter>) : Record[] {
    return records.filter((record) => {
        for (let name in filters) {
            let filter = filters[name];
            if (!filter.filter(record[name])) {
                return false;
            }
        }
        return true;
    });
}

/* Apply search sort and filters */
export function searchAndFilter(records: Record[], params:Map<string>, schema:StructType) {
    // Apply sort directive
    let sort = extractSort(params);
    applySort(records, sort);

    // Search & filter
    let search = parseSearch(params);
    let filters = extractFilters(schema, params);

    records = applySearch(records, search, schema);
    return applyFilters(records, filters);
}