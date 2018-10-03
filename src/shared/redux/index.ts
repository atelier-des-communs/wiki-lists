import {Action, Reducer} from "redux";
import {combineReducers} from "redux-seamless-immutable";
import {StructType} from "../model/types";
import * as Immutable from "seamless-immutable";
import {Record} from "../model/instances";
import {DbDefinition} from "../../server/db/db";
import {Map} from "../utils";


export interface IState {
    items : {[key:string] : Record};
    dbDefinition : DbDefinition;
}

export enum ActionType {
    ADD_ITEM = "ADD_ITEM",
    UPDATE_ITEM = "UPDATE_ITEM",
    DELETE_ITEM = "DELETE_ITEM",
    UPDATE_SCHEMA = "UPDATE_SCHEMA",
    UPDATE_DB = "UPDATE_DB",
}

interface ActionWithRecord extends Action {
    record : Record;
}

export class AddItemAction implements ActionWithRecord {
    public type = ActionType.ADD_ITEM;
    public record: Record;
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

export function createAddItemAction(record: Record) : AddItemAction {
    return {type:ActionType.ADD_ITEM, record:Immutable.from(record)}
}
export function createUpdateItemAction(record: Record) : UpdateItemAction {
    return {type:ActionType.UPDATE_ITEM, record:Immutable.from(record)}
}
export function createDeleteAction(id: string) : DeleteItemAction {
    return {type:ActionType.DELETE_ITEM, id}
}
export function createUpdateSchema(schema:StructType) : UpdateSchemaAction {
    return {type:ActionType.UPDATE_SCHEMA, schema:Immutable.from(schema)};
}
export function createUpdateDbAction(dbDef:DbDefinition) : UpdateDbAction {
    return {type:ActionType.UPDATE_DB, dbDef:Immutable.from(dbDef)};
}
export type TAction  =
    UpdateSchemaAction |
    UpdateDbAction |
    UpdateItemAction |
    AddItemAction |
    DeleteItemAction;

function itemsReducer(items:Immutable.ImmutableObject<Map<Record>> = null, action:TAction) {
    switch (action.type) {
        case ActionType.ADD_ITEM:
        case ActionType.UPDATE_ITEM:
            if (items == null) {
                items = Immutable.from({} as Map<Record>);
            }
            let record = (action as ActionWithRecord).record;
            return items.set(record._id, record);

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

/** Combine reducers */
export let reducers : Reducer<IState> = combineReducers ({
    items: itemsReducer,
    dbDefinition: dbDefReducer
});

