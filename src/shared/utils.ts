import * as Immutable from "seamless-immutable";
import "es6-promise";





/** Helper for mapping key => values to f(key, value)*/
type Callback<T,O> = (key: string, value:T) => O;

/** Loop over key, vlues of a map or object, and apply the function */
export function  mapMap<T, O>(map: {[key:string] : T}, callback: Callback<T, O>) : Array<O> {
    return Object.keys(map).map(key => callback(key, map[key]));
}

/** Handy map definition */
export interface Map<T = {}> {
    [index: string]: T;
    [index: number]: T;
}


/** Convert even Objects */
export function toImmutable<T>(js:T) : T {
    let json = JSON.parse(JSON.stringify(js));
    return Immutable.from(json);
}

export function sortBy(input: Map[], field: string, reverse: boolean = false) {

    let reverseInt = reverse ? -1 : 1;

    input.sort((item1, item2) => {
        let value1 = item1[field];
        let value2 = item2[field];
        if (value1 == null) return reverseInt;
        if (value2 == null) return reverseInt;
        if (value1 > value2) return 1 * reverseInt;
        if (value1 < value2) return -1 * reverseInt;
        return 0;
    });
}


export function arrayToMap<T>(arr : T[], keyFunc : (item:T) => string): Map<T> {
    var res : Map<T> = {};
    arr.forEach(function(item){
        res[keyFunc(item)] = item;
    })
    return res;
}

export function deepClone<T>(value: T) : T {
    return JSON.parse(JSON.stringify(value));
}