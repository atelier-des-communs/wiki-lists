import {DatetimeType, NumberType, StructType, TextType} from "./types";
import {deepClone} from "../utils";
import {IMessages} from "../i18n/messages";
import {registerClass} from "../serializer";


export class Record {

    _id?: string;
    _creationTime?: Date;
    _updateTime?: Date;
    _pos?: number;

    // Other fields, defined by the schema of the table
    [x:string]: any;
}
registerClass(Record, "record");

// Definition of system attributes, as StrucType
export function systemType(_: IMessages) {
    let res = new StructType();
    res.attributes.push({
        name: "_id",
        system: true,
        type: new TextType(),
        label: _.id_attr
    });

    res.attributes.push({
        name: "_creationTime",
        system: true,
        type: new DatetimeType(),
        label: _.creation_time_attr
    });

    res.attributes.push({
        name: "_updateTime",
        system: true,
        type: new DatetimeType(),
        label: _.update_time_attr
    });

    res.attributes.push({
        name: "_pos",
        system: true,
        hidden: true,
        type: new NumberType(),
        label: _.pos_attr
    });
    return res;
}

/** Prepend system attributes to a schema */
export function withSystemAttributes(schema:StructType, _:IMessages) {
    let res = deepClone(schema);
    res.attributes = [
        ...systemType(_).attributes.filter(attr => ! attr.hidden),
        ...schema.attributes];
    return res
}

export function withoutSystemAttributes(schema:StructType) {
    let res = deepClone(schema);
    res.attributes = schema.attributes.filter(attr => !attr.system);
    return res;
}
