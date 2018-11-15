import {deepClone, Map, mapMap} from "./utils";



// Custom serializers, to / from JSON object, in order to be able to add the @class property on it
interface Serializer<T> {
    toJson(obj:T): {};
    fromJson(json:{}): T;
}

// Registry of
let classRegistry : Map<Function | Serializer<{}>> = {};

const CLASS_PROP = "@class";

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

/** Transform tree of object into plain JSON tree, with "@type" decorations */
export function toJsonWithTypes<T>(obj:T) : T {

    if (obj == null) {
        return null;
    }

    if (Array.isArray(obj)) {

        return (obj as any).map(toJsonWithTypes);

    } else if (typeof(obj) == "object") {

        // Walk the tree
        let res : any = {};
        for (let key of Object.keys(obj)) {
            res[key] = toJsonWithTypes((obj as any)[key]);
        }

        // Simple object => no extra processing
        if (obj.constructor ===  Object) {
            return res;
        }

        // Get class tag
        let tag : string = (obj.constructor as any).tag;
        if (!tag) throw  new Error(`Missing tag for class : ${obj.constructor}`);

        // Get class or serializer
        if (!(tag in classRegistry)) throw new Error(`Type tag ${tag} not found in registry`);
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

/** Walks a JSON tree and replace "@type" tag with proper __proto__ */
export function toObjWithTypes<T>(json:T) : T {

    if (json == null) {
        return null;
    }

    if (Array.isArray(json)) {
        return (json as any).map(toObjWithTypes);
    } else if (typeof(json) == "object") {

        // Walk the tree
        let res : any = {};
        for (let key of Object.keys(json)) {
            res[key] = toObjWithTypes((json as any)[key]);
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