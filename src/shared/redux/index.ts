
import { Action, Reducer, ReducersMapObject} from "redux";
import {combineReducers} from "redux-seamless-immutable";
import {StructType} from "../model/types";
import * as Immutable from "seamless-immutable";
import {Record} from "../model/instances";

export interface IState {
    items : {[key:string] : any};
    schema : StructType;
}

export enum ActionType {
    ADD_ITEM = "ADD_ITEM",
    UPDATE_ITEM = "UPDATE_ITEM",
    DELETE_ITEM = "DELETE_ITEM",
    UPDATE_SCHEMA = "UPDATE_SCHEMA",
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

export type TAction  = UpdateSchemaAction | UpdateItemAction | AddItemAction | DeleteItemAction;

function itemsReducer(items:any={}, action:TAction) {
    switch (action.type) {
        case ActionType.ADD_ITEM:
        case ActionType.UPDATE_ITEM :
            let record = (action as ActionWithRecord).record;
            return items.set(record._id, record);

        case ActionType.DELETE_ITEM:
            return items.without((action as DeleteItemAction).id);
    }
    return items;
}

function schemaReducer(schema:{} = {}, action:TAction) {
    switch (action.type) {
        case ActionType.UPDATE_SCHEMA:
            return (action as UpdateSchemaAction).schema;
    }
    return schema;
}

/** Combine reducers */
export let reducers : Reducer<IState> = combineReducers ({
    items: itemsReducer,
    schema: schemaReducer
});

