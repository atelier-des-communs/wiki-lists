import {Action, Reducer} from "redux";
import {combineReducers} from "redux-seamless-immutable";
import {StructType} from "../model/types";
import * as Immutable from "seamless-immutable";
import {Record} from "../model/instances";
import {DbDefinition} from "../model/db-def";
import {Map} from "../utils";
import {toAnnotatedJson} from "../serializer";
import {IUser} from "../model/user";
import {MarkerOrCluster} from "../model/geo";




export interface ISortedPages {

    count:number;

    /** Filters sort and search */
    queryParams : any;

    /** Map<pageIdx => [recordid]> */
    pages : Map<string[]>;

    /** Geographic markers */
    markers : MarkerOrCluster[];

}
export interface IState {
    /** id => Rescord */
    items : {[key:string] : Record};

    sortedPages : ISortedPages;

    // Definition of DB
    dbDefinition : DbDefinition;
    user: IUser;
}

export enum ActionType {
    ADD_ITEM = "ADD_ITEM",
    ADD_ITEMS = "ADD_ITEMS",
    UPDATE_ITEM = "UPDATE_ITEM",
    DELETE_ITEM = "DELETE_ITEM",
    UPDATE_SCHEMA = "UPDATE_SCHEMA",
    UPDATE_DB = "UPDATE_DB",
    UPDATE_USER = "UPDATE_USER",
    UPDATE_COUNT = "UPDATE_COUNT",
    UPDATE_PAGE = "UPDATE_PAGE"
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

export class UpdateUserAction implements Action {
    public type = ActionType.UPDATE_USER;
    public user: IUser;
}

// SortedPages actions
export class UpdateCountAction {
    public type = ActionType.UPDATE_COUNT;
    public sortedPages : ISortedPages;
}

export class UpdatePageAction {
    public type = ActionType.UPDATE_PAGE;
    public idx : number;
    public page:string[];
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
export function createUpdateUserAction(user:IUser) : UpdateUserAction {
    return {type:ActionType.UPDATE_USER, user:toImmutableJson(user)};
}
export function createUpdateCountAction(sortedPages: ISortedPages) : UpdateCountAction {
    return {type:ActionType.UPDATE_COUNT, sortedPages:toImmutableJson(sortedPages)}
}
export function createUpdatePageAction(idx:number, page: string[]) : UpdatePageAction {
    return {type:ActionType.UPDATE_PAGE, idx, page}
}

export type TAction  =
    UpdateSchemaAction |
    UpdateDbAction |
    UpdateItemAction |
    AddItemAction |
    AddItemsAction |
    DeleteItemAction |
    UpdateUserAction |
    UpdateCountAction |
    UpdatePageAction;


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

            for (record of records) {
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

function userReducer(user: Immutable.ImmutableObject<IUser> = null, action : TAction) {
    if (action.type == ActionType.UPDATE_USER) {
        return (action as UpdateUserAction).user;
    } else {
        return user;
    }
}

function sortedPagesReducer(state: Immutable.ImmutableObject<ISortedPages>= null, action : TAction) {
    if (action.type == ActionType.UPDATE_COUNT) {
        return (action as UpdateCountAction).sortedPages;
    } else if (action.type == ActionType.UPDATE_PAGE) {
        let updatePageAction = action as UpdatePageAction;
        return state.setIn(['pages', updatePageAction.idx], updatePageAction.page);
    } else {
        return state;
    }
}

/** Combine reducers */
export let reducers : Reducer<IState> = combineReducers ({
    items: itemsReducer,
    dbDefinition: dbDefReducer,
    sortedPages : sortedPagesReducer,
    user:userReducer
});

/** Transform live object into immutable JSON with @class attributes to be put in store :
 * should be transformed back to 'live' object with toObjWithYypes */
function toImmutableJson(foo: any) {
    return Immutable.from(toAnnotatedJson((foo)));
}


