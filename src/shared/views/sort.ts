import {Map, sortBy} from "../utils";
import {Record} from "../model/instances";

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
        return null;
    }
}

export function applySort(records : Record[], sort:ISort) {
    if (sort) {
        sortBy(records,sort.key, !sort.asc);
    } else {
        // Default sort : creation time
        sortBy(records,"_creationTime", true);
    }
}