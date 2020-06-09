import {Action, Reducer} from "redux";
import {combineReducers} from "redux-seamless-immutable";
import {StructType} from "../model/types";
import * as Immutable from "seamless-immutable";
import {Record} from "../model/instances";
import {DbDefinition} from "../model/db-def";
import {Map} from "../utils";
import {toAnnotatedJson} from "../serializer";
import {Cluster} from "../model/geo";
import {Marker} from "../api";
import {Subscription} from "../model/notifications";


export type Pages = Map<string[]>;

export interface IState {
    /** id => Rescord */
    items : Map<Record>;

    // Indexed by filters
    geoMarkers : Map<Marker[]>;

    // Indexed by filters
    counts : Map<number>;

    // Indexed by filters and sort
    pages : Map<Pages>;

    // Definition of DB
    dbDefinition : DbDefinition;

    // Subscriptions
    subscriptions : Map<Subscription>;
}


export enum ActionType {
    ADD_ITEM = "ADD_ITEM",
    ADD_ITEMS = "ADD_ITEMS",
    UPDATE_ITEM = "UPDATE_ITEM",
    DELETE_ITEM = "DELETE_ITEM",
    UPDATE_SCHEMA = "UPDATE_SCHEMA",
    UPDATE_DB = "UPDATE_DB",
    UPDATE_COUNT = "UPDATE_COUNT",
    UPDATE_PAGE = "UPDATE_PAGE",
    UPDATE_MARKERS = "UPDATE_MARKERS",
    UPDATE_SUBSCRIPTION = "UPDATE_SUBSCRIPTION"
}

interface ActionWithRecord extends Action {
    record : Record;
}

export class AddItemAction implements ActionWithRecord {
    public type = ActionType.ADD_ITEM;
    public record: Record;
}


export class AddItemsAction implements Action {
    public type = ActionType.ADD_ITEMS;
    public records: Record[];
}


export class UpdateItemAction implements ActionWithRecord {
    public type = ActionType.UPDATE_ITEM;
    public record: Record;
}

export class DeleteItemAction implements Action {
    public type = ActionType.DELETE_ITEM;
    public id: string;
}

export class UpdateSchemaAction implements Action {
    public type = ActionType.UPDATE_SCHEMA;
    public schema: StructType;
}

export class UpdateDbAction implements Action {
    public type = ActionType.UPDATE_DB;
    public dbDef: DbDefinition;
}


// SortedPages actions
export class UpdateCountAction {
    public type = ActionType.UPDATE_COUNT;
    public queryKey: string;
    public count:number;
}

export class UpdatePageAction {
    public type = ActionType.UPDATE_PAGE;
    public querySortKey: string;
    public num : number;
    public page:string[];
}

export class UpdateMarkersAction {
    public type = ActionType.UPDATE_MARKERS;
    public markersByKey : Map<(Cluster | Record)[]>;
}

export class UpdateSubscriptionAction {
    public type = ActionType.UPDATE_SUBSCRIPTION;
    public subscription : Subscription;
}


export function createAddItemAction(record: Record) : AddItemAction {
    return {type:ActionType.ADD_ITEM, record:toImmutableJson(record)}
}
export function createAddItemsAction(records: Record[]) : AddItemsAction {
    return {type:ActionType.ADD_ITEMS, records:toImmutableJson(records)}
}

export function createUpdateItemAction(record: Record) : UpdateItemAction {
    return {type:ActionType.UPDATE_ITEM, record:toImmutableJson(record)}
}
export function createDeleteAction(id: string) : DeleteItemAction {
    return {type:ActionType.DELETE_ITEM, id}
}
export function createUpdateSchema(schema:StructType) : UpdateSchemaAction {
    return {type:ActionType.UPDATE_SCHEMA, schema:toImmutableJson(schema)};
}
export function createUpdateDbAction(dbDef:DbDefinition) : UpdateDbAction {
    return {type:ActionType.UPDATE_DB, dbDef:toImmutableJson(dbDef)};
}

export function createUpdateSubscriptionAction(subscription: Subscription) : UpdateSubscriptionAction {
    return {type:ActionType.UPDATE_SUBSCRIPTION, subscription:toImmutableJson(subscription)};
}
export function createUpdateCountAction(queryKey: string, count:number) : UpdateCountAction {
    return {type:ActionType.UPDATE_COUNT, queryKey, count}
}
export function createUpdatePageAction(querySortKey:string, num: number, page: string[]) : UpdatePageAction {
    return {type:ActionType.UPDATE_PAGE, querySortKey, page, num}
}
export function createUpdateMarkersAction(markersByKey : Map<Marker[]>) : UpdateMarkersAction {
    return {type:ActionType.UPDATE_MARKERS, markersByKey}
}

export type TAction  =
    UpdateSchemaAction |
    UpdateDbAction |
    UpdateItemAction |
    AddItemAction |
    AddItemsAction |
    DeleteItemAction |
    UpdateCountAction |
    UpdatePageAction |
    UpdateSubscriptionAction |
    UpdateMarkersAction;


function itemsReducer(items:Immutable.ImmutableObject<Map<Record>> = null, action:TAction) {
    switch (action.type) {
        case ActionType.ADD_ITEM:
        case ActionType.UPDATE_ITEM:
            if (items == null) {
                items = toImmutableJson({} as Map<Record>);
            }
            let record = (action as ActionWithRecord).record;
            return items.set(record._id, record);
        case ActionType.ADD_ITEMS :
            if (items == null) {
                items = toImmutableJson({} as Map<Record>);
            }
            let records = (action as AddItemsAction).records;

            for (let record of records) {
                items = items.set(record._id, record);
            }
            return items;

        case ActionType.DELETE_ITEM:
            return items.without((action as DeleteItemAction).id);
    }
    return items;
}

function dbDefReducer(dbDef:Immutable.ImmutableObject<DbDefinition> = null, action:TAction) {
    switch (action.type) {
        case ActionType.UPDATE_SCHEMA:
            let schema = (action as UpdateSchemaAction).schema;
            return dbDef.set("schema", schema);
        case ActionType.UPDATE_DB:
            return (action as UpdateDbAction).dbDef;
    }
    return dbDef;
}


function pagesReducer(state: Immutable.ImmutableObject<Map<Pages>> = null, action : TAction) {
    if (action.type == ActionType.UPDATE_PAGE) {
        let updatePageAction = action as UpdatePageAction;
        let pages = Immutable.from(state[updatePageAction.querySortKey] || {});
        pages = pages.set(updatePageAction.num, updatePageAction.page);
        return state.set(updatePageAction.querySortKey, pages);
    } else {
        return state;
    }
}

function countReducer(state:Immutable.ImmutableObject<Map<number>> = null, action: TAction) {
    if (action.type == ActionType.UPDATE_COUNT) {
        let updateCount = action as UpdateCountAction;
        return state.set(updateCount.queryKey, updateCount.count);
    } else {
        return state;
    }
}

function markersReducer(state: Immutable.ImmutableObject<Map<Marker[]>> = null, action : TAction) {
    if (action.type == ActionType.UPDATE_MARKERS) {
        let updateAction = action as UpdateMarkersAction;
        for (let key in updateAction.markersByKey) {
            state = state.set(key, updateAction.markersByKey[key]);
        }
        return state;
    } else {
        return state;
    }
}

function subscriptionReducer(state: Immutable.ImmutableObject<Map<Subscription>> = null, action : TAction) {
    if (action.type == ActionType.UPDATE_SUBSCRIPTION) {
        let subscription = (action as UpdateSubscriptionAction).subscription;
        return state.set(subscription.email, subscription);
    } else {
        return state;
    }
}

/** Combine reducers */
export let reducers : Reducer<IState> = combineReducers ({
    items: itemsReducer,
    dbDefinition: dbDefReducer,
    pages : pagesReducer,
    counts : countReducer,
    geoMarkers : markersReducer,
    subscriptions:subscriptionReducer
});

/** Transform live object into immutable JSON with @class attributes to be put in store :
 * should be transformed back to 'live' object with toObjWithYypes */
function toImmutableJson(foo: any) {
    return Immutable.from(toAnnotatedJson((foo)));
}


