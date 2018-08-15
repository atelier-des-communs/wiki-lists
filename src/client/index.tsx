import * as React from 'react';
import {render}  from "react-dom";
import {ReduxApp } from "../shared/app";
import { BrowserRouter } from 'react-router-dom'
import "../shared/favicon.ico";
import {createStore} from "redux";
import {IState, reducers} from "../shared/redux";
import {toImmutable} from "../shared/utils";


/** Initial state of the store has been serialized for us by server side rendering */

// Transform to seeamless-immutable, except for first level (because of combineReducers)
let INITIAL_STATE: IState = (window as any).__INITIAL_STATE__;
let store = createStore(
    reducers,
    toImmutable(INITIAL_STATE),

    // For dev only
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__());

render((
    <BrowserRouter>
        <ReduxApp store={store} />
    </BrowserRouter>
), document.getElementById("app"));
