import {Record} from "../model/instances";
import {Map, mapValues, sortByFunc} from "../utils";
import {Attribute} from "../model/types";

export class Group {
    value:any;
    attr:Attribute;
    records:Record[] = [];
    constructor(attr:Attribute, value:any) {
        this.attr = attr;
        this.value = value;
    }
}


export function groupBy(records:Record[], attr:Attribute): Group[] {
    let groups: Map<Group> = {};
    records.forEach((record)=>{
        let value = record[attr.name];
        let groupName = value + "";
        let group = groups[groupName];
        if (group == null) {
            group = new Group(attr, value);
            groups[groupName] = group;
        }
        group.records.push(record)
    });
    let res = mapValues(groups);
    sortByFunc(res, group => group.value);
    return res;
}

export function extractGroupBy(queryParams:Map) : string {
    return queryParams["g"] as string
}

/** Return query param to be set */
export function updatedGroupBy(groupBy:string) : Map<string> {
    return {g:groupBy};
}