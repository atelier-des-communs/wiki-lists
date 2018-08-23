import {Map} from "../utils";
import {TAction} from "../redux";

export enum ViewType {
    TABLE = "table",
    CARDS = "cards"
}

const QUERY_PARAM_NAME = "view"

export function extractViewType(queryParams:Map<string>) {
    let viewType = queryParams[QUERY_PARAM_NAME];
    return viewType == "c" ? ViewType.CARDS : ViewType.TABLE
}

/** Serialize view type to query params */
export function serializeViewType(type : ViewType) {
    if (type == ViewType.TABLE) {
        return {[QUERY_PARAM_NAME] : null}
    } else {
        return {[QUERY_PARAM_NAME] : type.toLowerCase().substr(0, 1)}
    }
}