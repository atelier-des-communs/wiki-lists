import {StructType} from "../model/types";
import {Map} from "../utils";

export enum AttributeDisplay {
    HIDDEN = "hidden",
    SMALL = "small",
    MEDIUM = "medium",
    FULL = "full",
}

function attrNameToQueryParam(attrName: string) {
    return  `${attrName}.d`;
}

// Extract display parameters from URL
export function extractDisplays(schema:StructType, queryParams: Map<string>) : Map<AttributeDisplay> {
    let res : Map<AttributeDisplay> = {};
    for (let attr of schema.attributes) {
        let paramName = attrNameToQueryParam(attr.name);
        let display = queryParams[paramName];
        if (display) {
            switch (display) {
                case "h" :
                    res[attr.name] = AttributeDisplay.HIDDEN; break;
                case "s" :
                    res[attr.name] = AttributeDisplay.SMALL; break;
                case "m" :
                    res[attr.name] = AttributeDisplay.MEDIUM; break;
                case "f" :
                    res[attr.name] = AttributeDisplay.FULL; break;
                default:
                    throw new Error(`Display type not recognized : ${display}`)

            }
        }
    }
    return res;
}

// Serialize display state into queryParams
export function serializeDisplay(displays : Map<AttributeDisplay>) : Map<string> {
    let res : Map<string> = {};
    for (let attrName in displays) {
        res[attrNameToQueryParam(attrName)] = displays[attrName].charAt(0);
    }
    return res;
}