import {Map} from "../utils";

export enum ViewType {
    PRINT = "print",
    TABLE = "table",
    CARDS = "cards"
}

const QUERY_PARAM_NAME = "view";
const DEFAULT_VIEW = ViewType.CARDS;

export function extractViewType(queryParams:Map<string>) {
    let viewType = queryParams[QUERY_PARAM_NAME];
    if (!viewType) {
        return DEFAULT_VIEW;
    }
    return viewType == "c" ? ViewType.CARDS : ViewType.TABLE
}

/** Serialize view type to query params */
export function serializeViewType(type : ViewType) {
    if (type == DEFAULT_VIEW) {
        return {[QUERY_PARAM_NAME] : null}
    } else {
        return {[QUERY_PARAM_NAME] : type.toLowerCase().substr(0, 1)}
    }
}