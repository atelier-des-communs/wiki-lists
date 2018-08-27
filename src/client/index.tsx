import * as React from 'react';
import {render}  from "react-dom";
import {MainApp} from "../shared/app";
import { BrowserRouter } from 'react-router-dom'
import "../shared/favicon.ico";
import {createStore} from "redux";
import {IState, reducers} from "../shared/redux";
import {toImmutable} from "../shared/utils";
import "./index.css";
import {GlobalContext} from "../shared/jsx/context/context";
import {IMarshalledContext} from "../shared/rest/api";
import {SimpleUserRights} from "../shared/access";


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

let auth = new SimpleUserRights(marshalledContext.rights);
let context : GlobalContext = {store, auth}

render((
    <BrowserRouter>
        <MainApp global={context} />
    </BrowserRouter>
), document.getElementById("app"));
