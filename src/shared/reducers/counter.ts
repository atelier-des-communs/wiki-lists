const NONE = "REACT/COUNTER/NONE";
const INCREMENT = "REACT/COUNTER/INCREMENT";
const DECREMENT = "REACT/COUNTER/DECREMENT";

export const initialState = {
    count: 0
}

import { Action, ActionCreatorsMapObject } from "redux";

export function reducer(state = initialState, action: Action = { type: NONE }) {
    switch (action.type) {
        case INCREMENT:
            return {
                ...state,
                count: state.count + 1
            };
        case DECREMENT:
            return {
                ...state,
                count: state.count - 1
            };
        default:
            return state;
    }
}

function increment() {
    return {
        type: INCREMENT
    };
}

function decrement() {
    return {
        type: DECREMENT
    };
}

export const actions: ActionCreatorsMapObject = {
    increment,
    decrement
};
