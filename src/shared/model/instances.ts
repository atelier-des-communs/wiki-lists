import {Attribute, DatetimeType, NumberType, StructType, TextType} from "./types";
import {IMessages} from "../i18n/messages";
import {classTag} from "../serializer";
import {cloneDeep} from "lodash";

@classTag("Record")
export class Record {

    _id?: string;
    _creationTime?: Date;
    _updateTime?: Date;
    _pos?: number;

    // Other fields, defined by the schema of the table
    [x:string]: any;
}

// Definition of system attributes, as StructType
export function systemType() {
    let res = new StructType();
    res.attributes.push({
        name: "_id",
        system: true,
        readonly: true,
        display: {details:false, summary:false},
        type: new TextType(),
        label: "@id_attr"
    });

    res.attributes.push({
        name: "_creationTime",
        system: true,
        readonly: true,
        display: {details:false, summary:false},
        type: new DatetimeType(),
        label: "@creation_time_attr"
    });

    res.attributes.push({
        name: "_updateTime",
        system: true,
        readonly: true,
        display: {details:false, summary:false},
        type: new DatetimeType(),
        label: "@update_time_attr"
    });

    res.attributes.push({
        name: "_pos",
        system: true,
        readonly: true,
        display: {details:false, summary:false},
        type: new NumberType(),
        label: "@pos_attr"
    });
    return res;
}

/** Prepend system attributes to a schema */
export function withSystemAttributes(schema:StructType) {
    let res = cloneDeep(schema);
    let names = res.attributes.map(attr => attr.name);
    for (let attr of systemType().attributes) {
        if (names.indexOf(attr.name) == -1) {
            res.attributes.push(attr);
        }
    }
    return res
}

export function nonSystemAttributes(attributes: Attribute[]) {
    return attributes.filter(attr => !attr.system);
}


