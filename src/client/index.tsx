import * as React from 'react';
import {render} from "react-dom";
import {App} from "../shared/app";
import {BrowserRouter} from 'react-router-dom'
import {createStore} from "redux";
import {reducers} from "../shared/redux";
import {toImmutable} from "../shared/utils";
import "./index.css";
import {GlobalContextProps, HeadSetter} from "../shared/jsx/context/global-context";
import {IMarshalledContext} from "../shared/api";
import {restDataFetcher} from "../shared/rest/client";


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

let head : HeadSetter = {
    setTitle : (newTitle:string) => {
        document.title = newTitle;
    }
};

let context : GlobalContextProps = {
    store,
    head,
    lang: marshalledContext.lang,
    messages:marshalledContext.messages,
    promises:[],
    dataFetcher:restDataFetcher};

render((
    <BrowserRouter>
        <App {...context} />
    </BrowserRouter>
), document.getElementById("app"));
