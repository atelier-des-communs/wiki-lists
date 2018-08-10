/** Base type abstraction */
import {Map} from "../utils";


export interface Type<T> {
    tag: string;
}

export const BOOLEAN_TYPE = "boolean";
export const NUMBER_TYPE = "number";
export const TEXT_TYPE = "text";

export class BooleanType implements Type<boolean> {
    tag = BOOLEAN_TYPE;
}

export class NumberType implements Type<number> {
    tag =  NUMBER_TYPE;
}

export class TextType implements Type<string> {
    tag = TEXT_TYPE;
}

export class Attribute {
    public name: string;
    public label: string;
    public type: Type<any>;
    constructor(name: string, type:Type<any>) {
        this.name = name;
        this.type = type;
    }
}

export class StructType implements Type<Map<any>> {
    tag: "struct";
    public attributes : Array<Attribute> = [];

    public addAttribute = (attr: Attribute) => {
        this.attributes.push(attr);
    }
}


