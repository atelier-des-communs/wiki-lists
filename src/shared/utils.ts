import * as Immutable from "seamless-immutable";
import "es6-promise";
import * as QueryString from "querystring";
import {RouteComponentProps} from "react-router";
import slugify from "slugify";
import {cloneDeep} from "lodash";
import {GlobalContextProps} from "./jsx/context/global-context";
import {DbPathParams} from "./jsx/common-props";
import {SharedConfig} from "./api";


/** Helper for mapping key => values to f(key, record)*/
type Callback<T,O> = (key: string, value:T) => O;

/** Loop over key, values of a map or object, and apply the function, return an array of values */
export function  mapMap<T, O>(map: {[key:string] : T}, callback: Callback<T, O>) : Array<O> {
    return Object.keys(map).map(key => callback(key, map[key]));
}

/** Apply function on a map, returns new map */
export function  mapKeyVals<T, O>(map: {[key:string] : T}, callback: Callback<T, O>) : Map<O> {
    let res : Map<O> = {};
    for (let key of Object.keys(map)) {
        res[key] = callback(key, map[key]);
    }
    return res;
}




/** Return all values of a map */
export function  mapValues<T>(map: {[key:string] : T}) : Array<T> {
    return Object.keys(map).map(key => map[key]);
}

/** One line for creating maps from arrays */
function buildMap<T, U>(list: T[], func: (item:T) => [string, U] ) : Map<U> {
    let res : Map<U> = {};
    for (let item of list) {
        let [k, val] = func(item);
        res[k] = val;
    }
    return res;
}

export function mapFromKeys<T>(keys: string[], func: (key:string) => T ) : Map<T> {
    return buildMap(keys, (key)=> [key, func(key)] )
}

export function mapFromValues<T>(values: T[], func: (value:T) => string) : Map<T> {
    return buildMap(values, (value)=> [func(value), value]);
}


export type OneOrMany<T> = T | T[];

/** Handy map definition */
export interface Map<T = {}> {
    [index: string]: T | null;
    [index: number]: T | null;
}


/** Convert even Objects */
export function toImmutable<T>(js:T) : T {
    let json = JSON.parse(JSON.stringify(js));
    return Immutable.from(json);
}

export function sortByFunc<T>(input: T[], keyFunc: (item:T) => any, reverse: boolean = false) {

    let reverseInt = reverse ? -1 : 1;

    input.sort((item1, item2) => {
        let value1 = keyFunc(item1);
        let value2 = keyFunc(item2);
        if (value1 == null) return reverseInt;
        if (value2 == null) return reverseInt;
        if (value1 > value2) return 1 * reverseInt;
        if (value1 < value2) return -1 * reverseInt;
        return 0;
    });
}

export function sortBy(input: Map[], field: string, reverse: boolean = false) {
    sortByFunc(input, (item:Map) => item[field], reverse);
}


export function arrayToMap<T>(arr : T[], keyFunc : (item:T) => string): Map<T> {
    var res : Map<T> = {};
    arr.forEach(function(item){
        res[keyFunc(item)] = item;
    });
    return res;
}



export function isIn(arr: string[], el:string) {
    return arr.indexOf(el) > -1;
}

/** Parse query params string into Map */
export function parseParams(queryString:string) : Map<string> {
    return QueryString.parse(queryString.replace(/^\?/, ''));
}


export function updatedParams(queryParams: Map<string>, newQuery:any) : Map<string> {
    let res = {...queryParams};
    for (let param in newQuery) {
        let value = newQuery[param];
        if (value == null) {
            // Null record ? => remove key from query
            delete res[param];
        } else {
            res[param] = value;
        }
    }
    return res;
}

export function updatedQuery(query: string, newParams:Map<string>) : string {
    let queryParams = parseParams(query);
    return "?" + QueryString.stringify(updatedParams(queryParams, newParams));
}

// Update history to go to same location, with different query params
export function goTo(props:RouteComponentProps<{}>, queryParams: Map<string>) {
    props.history.push(updatedQuery(props.location.search, queryParams));
}

export function goToResettingPage(props:RouteComponentProps<{}>, queryParams: Map<string>) {
    props.history.push(updatedQuery(props.location.search, {...queryParams, page:null}));
}

export function goToUrl(props:RouteComponentProps<{}>, link:string) {
    props.history.push(link);
}


export function eqSet(as:string[], bs:string  []) {
    if (as.length !== bs.length) return false;
    for (var a of as) if (!isIn(bs, a)) return false;
    return true;
}

export function remove(arr: string[], el:string) {
    var index = arr.indexOf(el, 0);
    if (index > -1) {
        arr.splice(index, 1);
    }
}

export function copyArr(arr:string[]) {
    let res = [];
    for(let i in arr) {
        res.push(arr[i]);
    }
    return res;
}

/** Undefined, null or empty string */
export function empty(a: any) {
    return typeof(a) == "undefined" || a === null || a === "";
}

export function emptyMap(map: Object) {
    return map == null || Object.keys(map).length == 0;
}

export function emptyList(list: any[]) {
    return list == null || list.length == 0;
}


// Builds a function calling a event handler and stoping propagation
export function stopPropag(eventFunc : () => void) {
    return (e:any, other:any) => {
        e.stopPropagation();
        eventFunc();
    }
}


export function itToArray<T>(it: IterableIterator<T>) : T[] {
    let res: T[] = [];
    for (let item of it) {
        res.push(item);
    }
    return res;
}



export function strToInt(value:string) {
    if (empty(value)) {
        return null;
    }
    return parseInt(value);
}

export function strToFloat(value:string) {
    if (empty(value)) {
        return null;
    }
    return parseFloat(value);
}



export function intToStr(value:number) {
    if (typeof(value) == "undefined" || value == null ||  isNaN(value)) {
        return null;
    }
    return value + "";
}

export function floatToStr(value:number) {
    if (typeof(value) == "undefined" || value == null ||  isNaN(value)) {
        return null;
    }
    return value + "";
}

export function slug(input:string, replacement='-') {
    // FIXME safer slug ?
    return slugify(input, {replacement, remove: /[*+~.()'"!:;@\\?\[\]#]/g, lower: true})
}



// Transform single element of anything into singleton list of it, or return same if it was already an Array
export function oneToArray<T>(elem : OneOrMany<T>) : T[]  {
    if (elem == null) {
        return []
    } else if (Array.isArray(elem)) {
        return elem;
    } else {
        return [elem]
    }
}


export function parseBool(value : any) {
    return value == "true" || value == 1 || value == "1" || value === true;
}


export function isPromise<T>(value:any) : boolean  {
    return (value && typeof value.then === 'function');
}

export function getDbName(props : RouteComponentProps<DbPathParams> & GlobalContextProps) {
    if (props.config.singleDb) {
        return props.config.singleDb
    } else {
        return props.match.params.db_name;
    }
}

/** Extract single value or die */
export function filterSingle<T>(values: T[], func : (val:T) => boolean, error:string="Should have single match") : T {
    let candidates = values.filter(func);
    if (candidates.length != 1) {
        return null;
    }
    return candidates[0];
}


// Pretty print of objects to console.log
export function debug(...args: any[]) {
    args = [];
    for(let i=0; i < arguments.length; i++) {
        let arg = arguments[i];
        if (typeof arg === "object") {
            args.push(JSON.stringify(arg, null, 4))
        } else {
            args.push(arg);
        }
    }
    console.debug.apply(null, args);
}

export function closeTo(a:number, b:number, epsilon:number=0.0000001) {
    return Math.abs(a - b) < epsilon;
}

export function humanReadableCount(count:number) : string {
    if (count < 1000) {
        return intToStr(count);
    } else {
        return intToStr(Math.round(count / 1000)) + " k";
    }
}