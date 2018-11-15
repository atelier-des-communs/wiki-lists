import * as React from 'react';
import {render} from "react-dom";
import {App} from "../shared/app";
import {BrowserRouter} from 'react-router-dom'
import {createStore} from "redux";
import {reducers} from "../shared/redux";
import {toImmutable} from "../shared/utils";
import "./index.css";
import {GlobalContextProps, HeadSetter, ICookies} from "../shared/jsx/context/global-context";
import {IMarshalledContext} from "../shared/api";
import {restDataFetcher} from "./rest/client";
import * as cookies from "browser-cookies";
import {toObjWithTypes} from "../shared/serializer";


/** Initial state of the store has been serialized for us by server side rendering */
let marshalledContext = toObjWithTypes(
    (window as any).__MARSHALLED_CONTEXT__ as IMarshalledContext);

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

// Head handler on client side : update document.title
let head : HeadSetter = {
    setTitle : (newTitle:string) => {
        document.title = newTitle;
    },

    // We don't care about updating description on client side
    setDescription : (desc:string) => {},

    // Unreleveant on client side
    setStatusCode : (code:number) => {}
};

let clientCookies : ICookies = {
    get : (name:string) => {
        return cookies.get(name);
    },

    set : (name:string, value:string) => {
        cookies.set(name, value)
    }
};

let context : GlobalContextProps = {
    store,
    head,
    lang: marshalledContext.lang,
    messages:(window as any).__MESSAGES__, // Set by lang-xx.js imported in html HEAD
    supportedLanguages:marshalledContext.supportedLanguages,
    promises:[],
    cookies : clientCookies,
    dataFetcher:restDataFetcher};

let app = <BrowserRouter>
    <App {...context} />
</BrowserRouter>;



render(app, document.getElementById("app"));
