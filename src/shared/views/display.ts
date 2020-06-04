import {attributesMap, StructType} from "../model/types";
import {Map, parseBool} from "../utils";


function attrNameToQueryParam(attrName: string) {
    return  `${attrName}.d`;
}

// Extract display parameters from URL
export function extractDisplays(schema:StructType, queryParams: Map<string>, context : "details" | "summary") : Map<boolean> {
    let res : Map<boolean> = {};
    for (let attr of schema.attributes) {
        let paramName = attrNameToQueryParam(attr.name);
        if (paramName in queryParams) {
            res[attr.name] = parseBool(queryParams[paramName]);
        } else {
            // Default value
            res[attr.name] = attr.display[context];
        }
    }
    return res;
}

// Serialize display state into queryParams
export function serializeDisplay(displays : Map<boolean>, schema:StructType, context : "details" | "summary" = "summary") : Map<string> {
    let res : Map<string> = {};
    let attrMap = attributesMap(schema);
    for (let attrName in displays) {
        let attr = attrMap[attrName];
        let defaultDisp = attr.display[context];
        let paramName = attrNameToQueryParam(attrName);
        let val = parseBool(displays[attrName]);
        res[paramName] = (val == defaultDisp) ? null : (val ? "1" : "0");
    }
    return res;
}