import * as React from 'react';
import {render}  from "react-dom";
import {IMarshalledContext, MainApp} from "../shared/app";
import { BrowserRouter } from 'react-router-dom'
import "../shared/favicon.ico";
import {createStore} from "redux";
import {IState, reducers} from "../shared/redux";
import {toImmutable} from "../shared/utils";
import "./index.css";


/** Initial state of the store has been serialized for us by server side rendering */
let marshalledContext = (window as any).__MARSHALLED_CONTEXT__ as IMarshalledContext;
let reduxDevTools =
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION__();

// Init store with marshalled context
let store = marshalledContext.env == "development" ?
    createStore(
        reducers,
        toImmutable(marshalledContext.state),
        reduxDevTools):
    createStore(
        reducers,
        toImmutable(marshalledContext.state));


render((
    <BrowserRouter>
        <MainApp store={store} />
    </BrowserRouter>
), document.getElementById("app"));
