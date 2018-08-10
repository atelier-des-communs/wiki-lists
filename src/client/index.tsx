import * as React from 'react';
import * as ReactDOM from "react-dom";
import {ReduxApp } from "../shared/app";
import { BrowserRouter } from 'react-router-dom'
import "../shared/favicon.ico";
import {createStore} from "redux";
import {IState, reducers} from "../shared/redux";


/** Initial state of the store has been serialized for us by server side rendering */
let initialState: IState = (window as any).__INITIAL_STATE__;

let store = createStore(
    reducers,
    initialState,
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__());

ReactDOM.render((
    <BrowserRouter>
        <ReduxApp store={store} />
    </BrowserRouter>
), document.getElementById("app"));
