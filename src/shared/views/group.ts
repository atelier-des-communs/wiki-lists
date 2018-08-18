import {Record} from "../model/instances";
import {Map, mapMap, mapToArray, sortBy, sortByFunc} from "../utils";

export class Group {
    key:string;
    records:Record[] = [];
    constructor(key:string) {
        this.key = key;
    }
}


export function groupBy(records:Record[], attr:string): Group[] {
    let groups: Map<Group> = {};
    records.forEach((record)=>{
        let groupName = record[attr] + "";
        let group = groups[groupName];
        if (group == null) {
            group = new Group(groupName);
            groups[groupName] = group;
        }
        group.records.push(record)
    });
    let res = mapToArray(groups);
    sortByFunc(res, group => group.key);
    return res;
}

export function extractGroupBy(queryParams:Map) : string {
    return queryParams["g"] as string
}

/** Return query param to be set */
export function updatedGroupBy(groupBy:string) : Map<string> {
    return {g:groupBy};
}