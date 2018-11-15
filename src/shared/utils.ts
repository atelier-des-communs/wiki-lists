import * as Immutable from "seamless-immutable";
import "es6-promise";
import * as QueryString from "querystring";
import {RouteComponentProps} from "react-router";
import slugify from "slugify";
import {cloneDeep} from "lodash";


/** Helper for mapping key => values to f(key, record)*/
type Callback<T,O> = (key: string, value:T) => O;

/** Loop over key, values of a map or object, and apply the function, return an array of values */
export function  mapMap<T, O>(map: {[key:string] : T}, callback: Callback<T, O>) : Array<O> {
    return Object.keys(map).map(key => callback(key, map[key]));
}


export function  mapToArray<T>(map: {[key:string] : T}) : Array<T> {
    return Object.keys(map).map(key => map[key]);
}

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
    })
    return res;
}

export function deepClone<T>(value: T) : T {
    return cloneDeep(value);
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


export function intToStr(value:number) {
    if (typeof(value) == "undefined" || value == null ||  isNaN(value)) {
        return null;
    }
    return value + "";
}

export function slug(input:string) {
    return slugify(input, {remove: /[*+~.()'"!:@\\?]/g, lower: true})
}

// Tranform synchronous function to Promise
// also takes Promise => returns it as is
export function resolveFuncOrPromise<T>(funcOrPromise : (() => Promise<T>) | (() => T)) : Promise<T> {
    // Not Promise ? => make one
    let res = funcOrPromise();
    if (res == null || !(res as any).then) {
        return new Promise((resolve, reject) => {resolve(res)});
    } else {
        return res as Promise<T>;
    }
}

