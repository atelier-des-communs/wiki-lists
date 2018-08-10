

/** Helper for mapping key => values to f(key, value)*/
type Callback<T,O> = (key: string, value:T) => O;

export function  mapMap<T, O>(map: {[key:string] : T}, callback: Callback<T, O>) : Array<O> {
    return Object.getOwnPropertyNames(map).map(key => callback(key, map[key]));
}

/** Handy map definition */
export interface Map<T = {}> {
    [index: string]: T;
    [index: number]: T;
}

export function type<T>(label: T | ''): T {
    return <T>label;
}