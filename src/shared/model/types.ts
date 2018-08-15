/** Base type abstraction */
import {Map} from "../utils";


export interface Type<T> {
    tag: string;
}

export enum Types {
    BOOLEAN = "boolean",
    NUMBER = "number",
    TEXT = "text",
    STRUCT = "struct",
    ENUM = "enum",
}
export class BooleanType implements Type<boolean> {
    tag = Types.BOOLEAN;
}

export class NumberType implements Type<number> {
    tag =  Types.NUMBER;
}

export class TextType implements Type<string> {
    tag = Types.TEXT;
    rich:boolean;
}

export interface EnumValue {
    value: string;
    label?: string,
    icon?: string,
    color?:string
}

export class EnumType implements Type<string> {
    tag = Types.ENUM;
    values : EnumValue[];
}

export class Attribute {
    name: string;
    label?: string;
    type: Type<any>;
}


export class StructType implements Type<Map<any>> {
    tag: Types.STRUCT;
    attributes : Array<Attribute> = [];
}


