import {empty, eqSet, goTo, intToStr, isIn, Map, oneToArray, parseParams, sortBy, strToInt} from "../utils";
import {Attribute, attributesMap, EnumType, StructType, Types} from "../model/types";
import {Record} from "../model/instances";
// import normalize from "normalize-text";
import {extractSort} from "./sort";
import {RouteComponentProps} from "react-router";
import {intersection} from "lodash";

function queryParamName(attrName: string) {
    return `${attrName}.f`;
}


// FIXME normalize seemsto break server
function normalize(value:string) {
    if (!value) {
        return "";
    } else {
        return value.toLowerCase();
    }
}

export interface IFilter<T> {
    attr:Attribute;
    filter(value:T):boolean;
    isAll():boolean;
}

export class BooleanFilter implements IFilter<boolean> {
    tag = Types.BOOLEAN;
    attr: Attribute;
    showTrue:boolean;
    showFalse:boolean;

    // Parse query params
    constructor(attr:Attribute, queryParams: Map<string> = {}) {
        this.attr = attr;
        let queryValue = queryParams[queryParamName(attr.name)];
        if (queryValue == null) {
            this.showTrue = true;
            this.showFalse = true;
        } else {
            let values = queryValue.split(",");
            this.showTrue = isIn(values,"true");
            this.showFalse = isIn(values,"false");
        }
    }

    isAll() {
        return this.showTrue && this.showFalse;
    }

    filter(value:boolean) {
        if (value) {
            return this.showTrue;
        } else {
            return this.showFalse;
        }
    }
}

export function serializeBooleanFilter(name:string, filter:BooleanFilter) {

    let paramName = queryParamName(name);

    // Same as no filter
    if (!filter || filter.isAll()) {
        return {[paramName]: null}
    }

    let res = [];
    if (filter.showTrue) {
        res.push('true');
    }
    if (filter.showFalse) {
        res.push('false');
    }
    return {[paramName]: res.join(",")};
}

export class TextFilter implements IFilter<string> {
    tag = Types.TEXT;
    attr: Attribute;
    search: string;
    searchNorm : string;

    // No filter : accepting all
    constructor(attr:Attribute, queryParams: Map<string> = {}) {
        this.attr = attr;
        let queryValue = queryParams[queryParamName(attr.name)];
        if (empty(queryValue)) {
            this.search = null;
            this.searchNorm = null;
        } else {
            this.search = queryValue;
            this.searchNorm = normalize(queryValue);
        }
    }

    isAll() {
        return !this.search;
    }

    filter(value:string) {
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

export function serializeTextFilter(attrName: string, filter:TextFilter) {

    let paramName = queryParamName(attrName);

    // Same as no filter
    if (!filter || filter.isAll()) {
        return {[paramName] :null};
    } else {
        return {[paramName]: filter.search};
    }
}

export class EnumFilter implements IFilter<string> {
    tag = Types.ENUM;
    attr: Attribute;
    showValues:string[];
    showEmpty:boolean;

    // No filter : accepting all
    constructor(attr:Attribute, queryParams:Map<string>= {}) {

        this.attr = attr;
        let allValues = this.allValues();

        let queryValue = queryParams[queryParamName(attr.name)];

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

    filter(value:string) {
        if (typeof(value) == "undefined" || value == null) {
            return this.showEmpty;
        } else {
            if ((this.attr.type as EnumType).multi) {
                let values = oneToArray(value);
                return intersection(values, this.showValues).length > 0;
            } else {
                return isIn(this.showValues, value)
            }
        }
    }
}

function serializeEnumFilter(attrName:string, filter:EnumFilter) {
    let paramName = queryParamName(attrName);

    // Same as no filter
    if (!filter || filter.isAll()) {
        return {[paramName]:null};
    }
    let res = [];
    if (filter.showEmpty) {
        res.push("empty");
    }
    res = res.concat(filter.showValues);
    return {[paramName]:res.join(",")};
}

function paramNameFrom(attrName: string) {
    return `${attrName}.f`
}
function paramNameTo(attrName: string) {
    return `${attrName}.t`
}

export class NumberFilter implements IFilter<number> {

    tag = Types.NUMBER;
    attr: Attribute;
    min:number = null;
    max:number = null;

    // No filter : accepting all
    constructor(attr:Attribute, queryParams : Map<string> = {}) {
        this.attr = attr;

        let min = strToInt(queryParams[paramNameFrom(attr.name)]);
        let max = strToInt(queryParams[paramNameTo(attr.name)]);

        if (min != null) {
            this.min = min;
        }
        if (max != null) {
            this.max = max;
        }
    }

    isAll() {
        return (this.min == null && this.max == null)
    }

    filter(value:number) {
        if (typeof (value) == "undefined" || value == null) {
            return true;
        }
        return (this.min == null || value >= this.min) &&
            (this.max == null || value <= this.max)
    }
}

function serializeNumberFilter(attrName:string, filter:NumberFilter) {

    let fromName = paramNameFrom(attrName);
    let toName = paramNameTo(attrName);
    if (!filter || filter.isAll()) {
        return {
            [fromName] : null,
            [toName] : null}
    }

    return {
        [fromName] : intToStr(filter.min),
        [toName] : intToStr(filter.max)
    }
}


export type Filter = BooleanFilter | EnumFilter | TextFilter | NumberFilter;

/** Serialize to an object with single attribute, ready to be merged with queryParams */
export function serializeFilter(attr:Attribute, filter:Filter | null) : Map<string> {
    switch (attr.type.tag) {
        case Types.BOOLEAN :
            return serializeBooleanFilter(attr.name, filter as BooleanFilter);
        case Types.ENUM :
            return serializeEnumFilter(attr.name, filter as EnumFilter);
        case Types.TEXT :
            return serializeTextFilter(attr.name, filter as TextFilter);
        case Types.NUMBER :
            return serializeNumberFilter(attr.name, filter as NumberFilter);
        default:
            throw new Error(`Type ${attr.type.tag} not supported`);
    }
}

export function extractFilters(schema: StructType, queryParams: Map<any>) : Map<Filter> {
    let res : Map<Filter> = {};
    for(let attr of  schema.attributes) {
        let filter : Filter = null;
        switch (attr.type.tag) {
            case Types.BOOLEAN :
                filter = new BooleanFilter(attr, queryParams);
                break;
            case Types.ENUM :
                filter = new EnumFilter(attr, queryParams);
                break;
            case Types.TEXT :
                filter = new TextFilter(attr, queryParams);
                break;
            case Types.NUMBER :
                filter = new NumberFilter(attr, queryParams);
                break;
        }
        if (filter && !filter.isAll()) {
            res[attr.name] = filter;
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

export function extractSearch(queryParams:Map<string>) {
    return queryParams["q"];
}

export function serializeSearch(search:string) {
    return {q: search}
}


export function applyFilters(records: Record[], filters : Map<IFilter<any>>) : Record[] {
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

export function applySearchAndFilters(records: Record[], params:Map<string>, schema:StructType) {
    // Apply sort directive
    let sort = extractSort(params);
    sortBy(records, sort.key, !sort.asc);

    // Search & filter
    let search = extractSearch(params);
    let filters = extractFilters(schema, params);

    records = applySearch(records, search, schema);
    return applyFilters(records, filters);
}


export function hasFiltersOrSearch(schema: StructType, props: RouteComponentProps<{}>) {
    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(schema, queryParams);
    let search = extractSearch(queryParams);
    return (Object.keys(filters).length > 0) || search;
}

export function clearFiltersOrSearch(schema: StructType, props: RouteComponentProps<{}>) {
    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(schema, queryParams);
    let attrMap = attributesMap(schema);
    let updatedParams = {}
    for (let attrName in filters) {
        let emptyFilter = serializeFilter(attrMap[attrName], null);
        updatedParams = {...updatedParams, ...emptyFilter}
    }
    updatedParams = {...updatedParams, ...serializeSearch(null)};
    goTo(props, updatedParams);
}