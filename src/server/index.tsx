import * as React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import {createStore } from "redux";
import {ReduxApp} from "../shared/app";
import "../shared/favicon.ico";
import {IState, reducers} from "../shared/redux";
import {initialState} from "./db/db";
import {Store} from "react-redux";



const store = createStore(reducers, initialState);


const CLIENT_SCRIPT_URL = (process.env.NODE_ENV === "production") ?
	'/client.bundle.js' : 'http://localhost:8081/client.bundle.js';

function renderHtml(req: any, store: Store<IState> ) {

    let app = <StaticRouter
        location={req.url}
        context={{}}
    >
        <ReduxApp store={store} />
    </StaticRouter>

	let appHTML = renderToString(app);

	return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>React Isomorphic Starter Kit</title>
				<link rel="stylesheet" href="/client.bundle.css">
				<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
			</head>
		
			<body>
				<div id="app">${appHTML}</div>
				<script>
					// Marchall store state in place
					window.__INITIAL_STATE__ = ${JSON.stringify(store.getState())};
				</script>
				<script src="${CLIENT_SCRIPT_URL}"></script>
			</body>
		</html>`
}


export default function (req: any, res: any) {
	console.log(req.url);
	res.status(200).send(renderHtml(req, store));
}
