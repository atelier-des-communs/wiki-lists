///<reference path="../shared/utils.ts"/>
import * as React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import {createStore } from "redux";
import {ReduxApp} from "../shared/app";
import "../shared/favicon.ico";
import {IState, reducers} from "../shared/redux";
import {getAllRecords, getSchema} from "./db/db";
import {Store} from "react-redux";
import {arrayToMap, toImmutable} from "../shared/utils";
import {Request, Express} from "express";
import {returnPromise} from "./utils";



const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '' : 'http://localhost:8081';

function renderHtml(url: string, store: Store<IState> ) {

    let app = <StaticRouter
        location={url}
        context={{}}>

        <ReduxApp store={store} />
    </StaticRouter>

	let appHTML = renderToString(app);

	return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>React Isomorphic Starter Kit</title>
				<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
				<link rel="stylesheet" href="${BUNDLE_ROOT}/client.bundle.css" />
			</head>
		
			<body>
				<div id="app">${appHTML}</div>
				<script>
					// Marchall store state in place
					window.__INITIAL_STATE__ = ${JSON.stringify(store.getState())};
				</script>
				<script src="${BUNDLE_ROOT}/client.bundle.js"></script>
			</body>
		</html>`
}

export let MY_DB_NAME = "mydb";

export async function index(req: Request): Promise<string> {

    let schema = await getSchema(MY_DB_NAME);
    let records = await getAllRecords(MY_DB_NAME);

    console.log("been there", schema);

    // Transform to seeamless-immutable, except for first level (because of combineReducers)
    let state : IState= {
        items: arrayToMap(records, record => record._id),
        schema: schema};

    console.log("Initial state", state);

    const store = createStore<IState>(
        reducers,
        toImmutable(state));

    return renderHtml(req.url, store);

}

export function setUp(server : Express) {
    server.get("*", function(req, res) {
        let html = index(req);
        returnPromise(res, html);
    });
}
