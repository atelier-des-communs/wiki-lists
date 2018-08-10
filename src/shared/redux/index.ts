
import { Action, combineReducers, Reducer } from "redux";
import {StructType} from "../model/types";
import {v1 as uuid} from "node-uuid";
import * as df from "babel-core/polyfill";



export interface IState {
    items : {[key:string] : any};
    schema : StructType;
}

export const ADD_ITEM = "ADD_ITEM";
export const UPDATE_ITEM = "UPDATE_ITEM";

interface ActionWithData<T> extends Action {
    data: T
}

export class AddItemAction implements ActionWithData<{}> {
    public type = ADD_ITEM;
    public data: any;
}

export class UpdateItemAction implements ActionWithData<{}> {
    public type = UPDATE_ITEM;
    public data: any;
}

export function createAction(actionType: string, data: {}) : ActionWithData<{}> {
    return {type:actionType, data}
}


function itemsReducer(items:{[key:string] : any}={}, action:Action) {
    
    console.log("Reducing : %s", action);
    
    let data = (<ActionWithData<any>> action).data;
    switch (action.type) {
        case ADD_ITEM:
            // New ? => create id
            data._id = uuid();
        case UPDATE_ITEM :
            return Object.assign()
            items[data._id] = data;
            break;
    }

}

/** Combine reducers */
export let reducers : Reducer<IState> = combineReducers ({
    items: itemsReducer
});

