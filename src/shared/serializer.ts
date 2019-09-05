/**
 * Serializer adding type information to JSON (with @class attribute) enabling to attach prototype to it on client side.
 * All Classes should be registered with the decorator @classTag(tag)
 */
import {deepClone, Map, mapMap} from "./utils";


// Custom serializers, to / from JSON object, in order to be able to add the @class property on it
interface Serializer<T> {
    toJson(obj:T): {};
    fromJson(json:{}): T;
}

// Registry of Classes => custom serializers
let classRegistry : Map<Function | Serializer<{}>> = {};

const CLASS_PROP = "@class";

/**
 * Add a Class to the registry.
 * Class may have a unique identifier as the "tag" property.
 * Don't use it directly, use the decorator @classTag instead
 */
export function registerClass<T>(type: { new (...args:any[]): T}, tag:string = null, serializer:Serializer<T>=null) {
    tag = tag || (type as any).tag;
    if (!tag) {
        console.log(type.prototype);
        throw new Error(`Missing type tag for class '${type}'`);
    }
    if (tag in classRegistry) throw new Error(`Class '${type}' already registered`);
    (type as any).tag = tag;

    if (serializer) {
        classRegistry[tag] = serializer;
    } else {
        classRegistry[tag] = type;
    }
}

export function clearRegistry() {
    classRegistry = {};
}

/** Transform tree of objects into plain JSON tree, with "@class" decorations */
export function toAnnotatedJson<T>(obj:T, path:string="") : T {

    if (obj == null) {
        return null;
    }

    if (Array.isArray(obj)) {

        return (obj as any).map((value:any, index:number) => toAnnotatedJson(value, `${path}[${index}]`));

    } else if (typeof(obj) == "object") {

        // Walk the tree
        let res : any = {};
        for (let key of Object.keys(obj)) {
            res[key] = toAnnotatedJson((obj as any)[key], `${path}.${key}` );
        }

        // Simple object => no extra processing
        if (obj.constructor ===  Object) {
            return res;
        }

        // Get class tag
        let tag : string = (obj.constructor as any).tag;
        if (!tag) throw  new Error(`Missing tag for class : ${obj.constructor} at '${path}'`);

        // Get class or serializer
        if (!(tag in classRegistry)) throw new Error(`Type tag ${tag} not found in registry at '${path}'`);
        let classHandler = classRegistry[tag];


        if (!(classHandler instanceof Function)) {
            // Custom serializer => replace with content of
            res = (classHandler as Serializer<{}>).toJson(obj);
        }

        res[CLASS_PROP] = tag;
        return res;

    } else {
        return obj;
    }
}

/** Walks a JSON tree and replace "@class" tag with proper __proto__ */
export function toTypedObjects<T>(json:T) : T {

    if (json == null) {
        return null;
    }

    if (Array.isArray(json)) {
        return (json as any).map(toTypedObjects);
    } else if (typeof(json) == "object") {

        // Walk the tree
        let res : any = {};
        for (let key of Object.keys(json)) {
            res[key] = toTypedObjects((json as any)[key]);
        }

        // Get class tag
        let tag = (json as any)[CLASS_PROP];

        // No class tag : nothing to do
        if (!tag) return res;

        // Get class or serializer
        if (!(tag in classRegistry)) throw new Error(`Type tag ${tag} not found in registry`);
        let classHandler = classRegistry[tag];

        if (!(classHandler instanceof Function)) {
            // Custom serializer => replace with content of
            return (classHandler as Serializer<T>).fromJson(json);
        } else {
            res.__proto__ = classHandler.prototype;
            delete res[CLASS_PROP];
            return res;
        }
    } else {
        return json;
    }
}

/** Class decorator used to register a class for serialization / deserialization */
export function classTag(tag:string) {
    return function(clazz: Function) {
        (clazz as any).tag = tag;
        registerClass(clazz as any, tag);
    }
}

// Custom type serializer
// TODO : Move it elsewhere
registerClass(Date, "date", {
    toJson(date: Date) {
        return {
            value : date ? date.toISOString() : null
        }
    },
    fromJson(json : any) {
        return json.value ? new Date(Date.parse(json.value)) : null;
    }
});