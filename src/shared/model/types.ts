import {arrayToMap, Map} from "../utils";
import {classTag} from "../serializer";
import {extend, includes} from "lodash";
import {ICoord} from "./geo";
import {encode as geohash} from "ngeohash";

export abstract class Type<T> {
    tag: string;
    abstract sortable:boolean;

    abstract isValid (value:any) : boolean;

    // FIXME :should be on SS only

    // By default we store values as is
    toMongo(value : T) : any {
        return value;
    }

    fromMongo(value : any) : T {
        return value;
    }

    // Value to be used for mongo index creation
    abstract mongoIndex() : (number|string)[];

}

export enum Types {
    BOOLEAN = "boolean",
    NUMBER = "number",
    TEXT = "text",
    STRUCT = "struct",
    ENUM = "enum",
    DATETIME = "datetime",
    LOCATION="location"
}

@classTag(Types.BOOLEAN)
export class BooleanType extends Type<boolean> {
    tag = Types.BOOLEAN;
    sortable = true;

    isValid(value: any): boolean {
        return (value === true || value === null || value === false)
    }

    mongoIndex(): (1|string)[] {
        return [1];
    }
}

@classTag(Types.NUMBER)
export class NumberType extends Type<number> {

    tag =  Types.NUMBER;
    sortable = true;

    isValid(value: any): boolean {
        return (value === null || !isNaN(value))
    }

    mongoIndex(): (1|string)[] {
        return [1];
    }
}

@classTag(Types.DATETIME)
export class DatetimeType extends Type<Date> {

    tag =  Types.DATETIME;
    sortable = true;

    isValid(value: any): boolean {
        return (value === null || value instanceof Date)
    }

    mongoIndex() {
        return [1];
    }
}

@classTag(Types.LOCATION)
export class LocationType extends Type<ICoord> {

    tag =  Types.LOCATION;
    sortable = false;

    isValid(value: any): boolean {
        return (value === null || ('lat' in value && 'lon' in value));
    }

    toMongo(value:ICoord) : any {
        if (value == null || value.lon == null) {
            return null;
        }
        return {
            type: "Point",
            coordinates : [value.lon, value.lat],
            properties : {
                "hash" : geohash(value.lat, value.lon, 10)
            }
        }
    }
    fromMongo(value : any) : ICoord {
        if (value == null) {
            return null;
        }
        return {
            lon: value['coordinates'][0],
            lat: value['coordinates'][1],
        }
    }

    mongoIndex() {
        return ["2dsphere"];
    }
}

@classTag(Types.TEXT)
export class TextType extends Type<string> {

    tag = Types.TEXT;
    rich:boolean = false;

    get sortable() {
        return ! this.rich;
    }

    constructor(rich:boolean = false) {
        super();
        this.rich = rich;
    }
    isValid(value: any): boolean {
        return (value === null || typeof(value) === "string");
    }

    mongoIndex() {
        if (this.rich) {
            return ["text"];
        } else {
            return [1, "text"];
        }
    }

}

@classTag("EnumValue")
export class EnumValue {
    value: string;
    label?: string;
    icon?: string;
    color?:string;
    saved?:boolean;

    constructor(value ?: string, label ?: string, icon ?: string, color ?: string, saved ?: boolean) {
        this.value = value;
        this.label = label;
        this.icon = icon;
        this.color = color;
        this.saved = saved;
    }


}

@classTag(Types.ENUM)
export class EnumType extends Type<string> {
    tag = Types.ENUM;
    values : EnumValue[] = [];
    sortable = true;

    isValid(value: any): boolean {
       let values = this.values.map(enumVal => enumVal.value);
       return (value == null || includes(values, value) );
    }

    mongoIndex() {
        return [1];
    }
}

export function newType(typeTag:string) {
    switch(typeTag) {
        case Types.TEXT :
            return new TextType();
        case Types.NUMBER :
            return new NumberType();
        case Types.BOOLEAN :
            return new BooleanType();
        case Types.DATETIME:
            return new DatetimeType();
        case Types.ENUM:
            let res = new EnumType();
            // Two empty values for the UI
            // FIXME : should be on UI side, not here
            res.values.push(new EnumValue("option1", "Option 1"));
            res.values.push(new EnumValue("option2", "Option 2"));
            return res;
        default:
            throw new Error(`Type not supported : ${typeTag}`);
    }
}

export interface AttributeDisplay {
    details:boolean;
    summary:boolean;
}

@classTag("attribute")
export class Attribute {
    new? : boolean;
    uid?: string;
    name: string;
    label?: string;
    type: Type<any>;
    isName?: boolean = false;
    isMandatory?: boolean = false;
    system ?:boolean = false;
    display?:AttributeDisplay = {details:true, summary:true};
    readonly? : boolean = false;
    constructor(init:Attribute) {
        extend(this, init);
    }
}

@classTag(Types.STRUCT)
export class StructType extends Type<Map<any>> {

    tag: Types.STRUCT;
    attributes : Attribute[] = [];
    sortable : false;

    constructor(attributes:Attribute[] = []) {
        super()
        this.attributes = attributes;
    }

    isValid(value: any): boolean {

        // FIXME put in a computed field not to be serialized
        let attrMap : Map<Attribute> = arrayToMap(this.attributes, attr => attr.name);

        if (value == null) {
            return true;
        }
        for (let key in value) {
            if (!(key in attrMap)) {
                return false;
            }
            let attr = attrMap[key];
            if (!attr.type.isValid(value[key])) {
                return false;
            }
        }
        return true;
    }

    mongoIndex() : (number | string)[]{
        return [];
    }

    // FIXME : recursively transform value to / from mongo ?
}

export function attributesMap(schema:StructType) : Map<Attribute> {
    return arrayToMap(schema.attributes, attr => attr.name);
}

export function enumValuesMap(type:EnumType) : Map<EnumValue> {
    return arrayToMap(type.values, enumVal => enumVal.value);
}


