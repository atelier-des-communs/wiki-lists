///<reference path="../shared/utils.ts"/>
import * as React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import {createStore } from "redux";
import {MainApp} from "../shared/app";
import "../shared/favicon.ico";
import {IState, reducers} from "../shared/redux";
import {getAllRecordsDb, getDbDefinition} from "./db/db";
import {Store} from "react-redux";
import {arrayToMap, deepClone, Map, parseParams, toImmutable} from "../shared/utils";
import {Express} from "express";
import {getAccessRights, HttpError, returnPromise} from "./utils";
import {Request, Response} from "express-serve-static-core"
import {_} from "../shared/i18n/messages";
import {IMarshalledContext} from "../shared/rest/api";
import {GlobalContext} from "../shared/jsx/context/context";
import {AccessRight, SimpleUserRights} from "../shared/access";



const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '' : 'http://localhost:8081';

function renderHtml(dbName:string, url: string, store: Store<IState>, rights:AccessRight[]) {

    let globalContext : GlobalContext = {
        auth : new SimpleUserRights([AccessRight.ADMIN, AccessRight.EDIT, AccessRight.VIEW]),
        store}

    let app = <StaticRouter
        location={url}
        context={{}}>

        <MainApp global={globalContext} />
    </StaticRouter>

	let appHTML = renderToString(app);

    let context : IMarshalledContext = {
        state : store.getState(),
        env: process.env.NODE_ENV,
        rights};

	return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>${_.daadle_title}</title>
				<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
				<link rel="stylesheet" href="${BUNDLE_ROOT}/client.bundle.css" />
			</head>
		
			<body>
				<div id="app">${appHTML}</div>
				<script>
					// Marchall store state in place
					window.__MARSHALLED_CONTEXT__ = ${JSON.stringify(context)};
				</script>
				<script src="${BUNDLE_ROOT}/client.bundle.js"></script>
			</body>
		</html>`
}


export async function index(db_str:string, req: Request): Promise<string> {

    // db_name may be composed of db_name@pass, for admin access
    let [db_name, pass] = db_str.split("@");
    let rights = await getAccessRights(db_name, pass);
    let dbDef = await getDbDefinition(db_name);

    let records = await getAllRecordsDb(db_name);

    let state : IState= {
        items: arrayToMap(records, record => record._id ? record._id : ""),
        schema: dbDef.schema};

    const store = createStore<IState>(
        reducers,
        toImmutable(state));

    return renderHtml(db_name, req.url, store, rights);
}




export function setUp(server : Express) {

    server.get("/db/:db_name", function(req:Request, res:Response) {
        let html = index(req.params.db_name, req);
        returnPromise(res, html);
    });
    server.get("/db/:db_name/*", function(req:Request, res:Response) {
        let html = index(req.params.db_name, req);
        returnPromise(res, html);
    });
}
