import {Type, BooleanType, StructType, TextType, NumberType, Attribute} from "./types";
import {Map} from "../utils";
import {ObjectId} from "mongodb";
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
    type: new TextType(),
    label : _.id_attr});

systemType.attributes.push({
    name:"_creationTime",
    type: new TextType(), // FIXME : Should be date time
    label : _.creation_time_attr});

systemType.attributes.push({
    name:"_updateTime",
    type: new TextType(), // FIXME : Should be date time
    label : _.update_time_attr});

systemType.attributes.push({
    name:"_pos",
    type: new NumberType(), // FIXME : Should be date time
    label : _.pos_attr});

interface Value<T> {
    type: Type<T>;
    value: T;
}

export class BooleanValue implements Value<boolean> {
    type: BooleanType;
    value: boolean;
}

export class TextValue implements Value<string> {
    type: TextType;
    value: string;
}

export class NumberValue implements Value<number> {
    type: NumberType;
    value: number;
}

export class StructValue implements Value<Map<any>> {
    type: StructType;
    value: {[key:string]:Value<any>}; // map of values
}

