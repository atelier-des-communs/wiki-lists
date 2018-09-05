import {Map} from "../utils";

export interface ISort {
    key: string;
    asc:boolean;
}

/** Extract sort directive from query params */
export function extractSort(queryParams:Map<string>) : ISort {
    let sort = queryParams.sort;
    if (sort) {
        let [sortKey, direction] = sort.split(".");
        return {
            key:sortKey,
            asc:direction == "asc"
        }
    } else {
        // Default sort
        // Default sort : creation time
        return {key: "_creationTime", asc:false}
    }
}

export function serializeSort(sort:ISort) : Map<string> {
    return {sort: sort.key + "." + (sort.asc ? "asc" : "desc")}
}
