import { NONE, DECREMENT, INCREMENT } from './types';

export const initialState = {
    count: 0
}

import { Action } from "redux";

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