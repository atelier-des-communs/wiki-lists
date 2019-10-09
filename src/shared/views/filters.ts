import {
    empty,
    eqSet, floatToStr,
    goTo,
    intToStr,
    isIn,
    Map,
    mapMap,
    mapValues,
    parseParams,
    sortBy,
    strToFloat,
    strToInt
} from "../utils";
import {Attribute, attributesMap, EnumType, StructType, Types} from "../model/types";
import {Record} from "../model/instances";
// import normalize from "normalize-text";
import {extractSort, ISort, serializeSort} from "./sort";
import {RouteComponentProps} from "react-router"
import {ICoord} from "../model/geo";
import * as tilebelt from "tilebelt";
import {startsWith} from "lodash";

function queryParamName(attrName: string) {
    return `${attrName}.f`;
}


// FIXME normalize seems to break server
function normalize(value:string) {
    if (!value) {
        return "";
    } else {
        return value.toLowerCase();
    }
}

export interface IFilter<T> {

    // Attribute
    attr:Attribute;

    // Applies the filter on a value
    filter(value:T):boolean;

    // To mongoDb filter :
    mongoFilter(): any;

    // For empty filter
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

    mongoFilter(): any {
        if (this.isAll()) {
            return null;
        }
        return {[this.attr.name]: this.showTrue}
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
    exact:boolean;
    searchNorm : string;

    // No filter : accepting all
    constructor(attr:Attribute, queryParams: Map<string> = {}) {
        this.attr = attr;
        this.exact = false;
        let queryValue = queryParams[queryParamName(attr.name)];

        if (empty(queryValue)) {
            this.search = null;
            this.searchNorm = null;
        } else {
            if (startsWith(queryValue, "=")) {
                this.search = queryValue.substr(1);
                this.exact = true
            } else {
                this.search = queryValue;
            }
            this.searchNorm = normalize(this.search);
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

    mongoFilter(): any {
        if (this.isAll()) {
            return null;
        }
        return {
            [this.attr.name] :
                this.exact ?
                    this.search :
                    new RegExp(normalize(this.search), 'i')};
    }
}

export function serializeTextFilter(attrName: string, filter:TextFilter) {

    let paramName = queryParamName(attrName);

    // Same as no filter
    if (!filter || filter.isAll()) {
        return {[paramName] :null};
    } else {
        return {[paramName]: (filter.exact ? "=" : "") + filter.search};
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
        let type = this.attr.type as EnumType;
        return type.values.map(enumVal => enumVal.value);
    }

    isAll() {
        return this.showEmpty && eqSet(this.allValues(), this.showValues);
    }

    filter(value:string) {
        if (typeof(value) == "undefined" || value == null) {
            return this.showEmpty;
        } else {
            return isIn(this.showValues, value);
        }
    }

    mongoFilter(): any {
        if (this.isAll()) {
            return null;
        }
        var res :any = {
            [this.attr.name] : {
                $in: this.showValues
            }
        };

        if (this.showEmpty) {
            res = {$or : [
                {[this.attr.name]: null},
                res]}
        }
        return res;
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
    mongoFilter(): any {
        if (this.isAll()) {
            return null;
        }
        var res : any = {};
        if (this.min != null) {
            res['$gte'] = this.min;
        }
        if (this.max != null) {
            res['$lte'] = this.max;
        }
        return {[this.attr.name] :res};
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

function paramMinLon(attrName: string) {
    return `${attrName}.fx`
}
function paramMaxLon(attrName: string) {
    return `${attrName}.tx`
}
function paramMinLat(attrName: string) {
    return `${attrName}.fy`
}
function paramMaxLat(attrName: string) {
    return `${attrName}.ty`
}

export class LocationFilter implements IFilter<ICoord> {

    tag = Types.LOCATION;
    attr: Attribute;
    minlon:number = null;
    maxlon:number = null;
    minlat:number = null;
    maxlat:number = null;
    geohash:string = null;

    // No filter : accepting all
    constructor(attr:Attribute, queryParams : Map<string> = {}) {
        this.attr = attr;


        // console.debug("Loc filter parsing, query params", queryParams);

        if (!queryParams) {
            return
        }

        // Direct hash ?
        if (queryParams[attr.name]) {
            this.geohash = queryParams[attr.name];
            let tile = tilebelt.quadkeyToTile(this.geohash);
            let box = tilebelt.tileToBBOX(tile);
            this.minlon = box[0];
            this.minlat = box[1];
            this.maxlon = box[2];
            this.maxlat = box[3];
        } else {
            this.minlon = strToFloat(queryParams[paramMinLon(attr.name)]);
            this.maxlon = strToFloat(queryParams[paramMaxLon(attr.name)]);
            this.minlat = strToFloat(queryParams[paramMinLat(attr.name)]);
            this.maxlat = strToFloat(queryParams[paramMaxLat(attr.name)]);
        }

    }

    isAll() {
        return (
            this.geohash == null &&
            this.minlon == null
            && this.minlat == null
            && this.maxlon == null
            && this.maxlat == null)
    }

    filter(value:ICoord) {
        if (this.isAll()) {
            return true;
        }
        if (typeof (value) == "undefined" || value == null) {
            return false;
        }
        return (this.minlon <= value.lon) &&
            (this.maxlon >= value.lon) &&
            (this.minlat <= value.lat) &&
            (this.maxlat >= value.lat);
    }
    mongoFilter(): any {
        if (this.isAll()) {
            return null;
        }
        if (this.geohash) {

            // Geohash ? => search prefix
            return {
                [this.attr.name + ".properties.hash" ] : {
                    $regex: RegExp(`^${this.geohash}.*`),
                }
            }
        } else {
            // Use geo2d index
            return {
                [this.attr.name] : {
                    $geoWithin : {
                        // We use GeoJson matching instead of $box, otherwize Mongo does not use indexes
                        $geometry: {
                            type: "Polygon" ,
                            coordinates: [[
                                [this.minlon, this.minlat],
                                [this.minlon, this.maxlat],
                                [this.maxlon, this.maxlat],
                                [this.maxlon, this.minlat],
                                [this.minlon, this.minlat],
                            ]]
                        }
                    }
                }
            }
        }
    }
}

function serializeLocationFilter(attrName:string, filter:LocationFilter) {

    let minlon = paramMinLon(attrName);
    let maxlon = paramMaxLon(attrName);
    let minlat = paramMinLat(attrName);
    let maxlat = paramMaxLat(attrName);
    if (!filter || filter.isAll()) {
        return {
            [minlon]: null,
            [maxlon]: null,
            [minlat]: null,
            [maxlat]: null,
            [attrName] : null}
    }
    if (filter.geohash) {
        return {[attrName] : filter.geohash}
    } else {
        return {
            [minlon]: floatToStr(filter.minlon),
            [maxlon]: floatToStr(filter.maxlon),
            [minlat]: floatToStr(filter.minlat),
            [maxlat]: floatToStr(filter.maxlat)
        }
    }
}




export type Filter = BooleanFilter | EnumFilter | TextFilter | NumberFilter | LocationFilter;

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
        case Types.LOCATION :
            return serializeLocationFilter(attr.name, filter as LocationFilter);
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
            case Types.LOCATION :
                filter = new LocationFilter(attr, queryParams);
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

export function serializeFilters(filters: Filter[]) {
    let res= {};
    filters.map(function(filter:Filter) {
        res = {...res, ...serializeFilter(filter.attr, filter)};
    });
    return res;
}

export function serializeSortAndFilters(sort: ISort, filters: Map<Filter>, search:string) : Map<any>{
    return {
        ...serializeFilters(mapValues(filters)),
        ...serializeSort(sort),
        ...serializeSearch(search)};
}

export function clearFiltersOrSearch(schema: StructType, props: RouteComponentProps<{}>) {
    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(schema, queryParams);
    let attrMap = attributesMap(schema);
    let updatedParams = {};
    for (let attrName in filters) {
        let emptyFilter = serializeFilter(attrMap[attrName], null);
        updatedParams = {...updatedParams, ...emptyFilter}
    }
    updatedParams = {...updatedParams, ...serializeSearch(null)};
    goTo(props, updatedParams);
}