import {DatetimeType, NumberType, StructType, TextType} from "./types";
import {deepClone} from "../utils";
import {_} from "../i18n/messages";


export interface Record {

    _id?: string;
    _creationTime?: Date;
    _updateTime?: Date;
    _pos?: number;

    // Other fields, defined by the schema of the table
    [x:string]: any;
}

// Definition of system attributes, as StrucType
export let systemType = new StructType();
systemType.attributes.push({
    name:"_id",
    saved:true,
    system:true,
    type: new TextType(),
    label : _.id_attr});

systemType.attributes.push({
    name:"_creationTime",
    saved:true,
    system:true,
    type: new DatetimeType(),
    label : _.creation_time_attr});

systemType.attributes.push({
    name:"_updateTime",
    saved:true,
    system:true,
    type: new DatetimeType(),
    label : _.update_time_attr});

systemType.attributes.push({
    name:"_pos",
    saved:true,
    system:true,
    type: new NumberType(),
    label : _.pos_attr});

/** Prepend system attributes to a schema */
export function withSystemAttributes(schema:StructType) {
    let res = deepClone(schema);
    res.attributes = [...systemType.attributes, ...schema.attributes];
    return res
}

export function withoutSystemAttributes(schema:StructType) {
    let res = deepClone(schema);
    res.attributes = schema.attributes.filter(attr => !attr.system);
    return res;
}
