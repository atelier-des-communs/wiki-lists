
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

export function createAddItemAction(record: Record) : AddItemAction {
    return {type:ActionType.ADD_ITEM, record}
}
export function createUpdateItemAction(record: Record) : UpdateItemAction {
    return {type:ActionType.UPDATE_ITEM, record}
}
export function createDeleteAction(id: string) : DeleteItemAction {
    return {type:ActionType.DELETE_ITEM, id}
}

function itemsReducer(items:any={}, action:Action | any) {

    console.log("Items reducer received action", action);


    switch (action.type) {
        case ActionType.ADD_ITEM:
        case ActionType.UPDATE_ITEM :
            let record = (action as ActionWithRecord).record;
            return items.set(record._id, record);

        case ActionType.DELETE_ITEM:
            return items.without(action.id);
    }
    return items;
}

function schemaReducer(schema:{} = {}, action:{}) {
    return schema;
}

/** Combine reducers */
export let reducers : Reducer<IState> = combineReducers ({
    items: itemsReducer,
    schema: schemaReducer
});

