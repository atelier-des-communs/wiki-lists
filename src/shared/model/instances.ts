import {Type, BooleanType, StructType, TextType, NumberType} from "./types";
import {Map} from "../utils";

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

