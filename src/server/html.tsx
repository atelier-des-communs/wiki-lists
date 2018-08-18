///<reference path="../shared/utils.ts"/>
import * as React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import {createStore } from "redux";
import {IMarshalledContext, MainApp} from "../shared/app";
import "../shared/favicon.ico";
import {IState, reducers} from "../shared/redux";
import {getAllRecordsDb, getSchema} from "./db/db";
import {Store} from "react-redux";
import {arrayToMap, Map, toImmutable} from "../shared/utils";
import {Express} from "express";
import {returnPromise} from "./utils";
import {Workbook} from "exceljs";
import {applySearchAndFilters} from "../shared/views/filters";
import {Request, Response} from "express-serve-static-core"
import {_} from "../shared/i18n/messages";
import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../shared/rest/api";



const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '' : 'http://localhost:8081';

function renderHtml(dbName:string, url: string, store: Store<IState> ) {

    let app = <StaticRouter
        location={url}
        context={{}}>

        <MainApp store={store} />
    </StaticRouter>

	let appHTML = renderToString(app);

    let context : IMarshalledContext = {
        state : store.getState(),
        dbName : dbName,
        env: process.env.NODE_ENV
    };

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


export async function index(db_name:string, req: Request): Promise<string> {

    let schema = await getSchema(db_name);
    let records = await getAllRecordsDb(db_name);

    console.log("been there", schema);

    // Transform to seeamless-immutable, except for first level (because of combineReducers)
    let state : IState= {
        items: arrayToMap(records, record => record._id ? record._id : ""),
        schema: schema};

    console.log("Initial state", state);

    const store = createStore<IState>(
        reducers,
        toImmutable(state));

    return renderHtml(db_name, req.url, store);

}

async function getAllWithFilters(db_name:string, query:Map<string>) : Promise<any> {
    let schema = await getSchema(db_name);
    let records = await getAllRecordsDb(db_name);
    return applySearchAndFilters(records, query, schema);
}

async function toExcel(db_name:string, req:any, res:any): Promise<any> {
    let schema = await getSchema(db_name);
    let records = await getAllWithFilters(db_name, req.query);

    var workbook = new Workbook();
    let worksheet = workbook.addWorksheet("main");
    worksheet.columns = schema.attributes.map(attr => ({header:attr.name, key:attr.name}));
    for (let record  of records) {
        worksheet.addRow(record);
    }
    res.setHeader("Content-Disposition", 'attachment; filename="export.xls"');
    res.setHeader("Content-Type", 'application/vnd.ms-excel');
    return workbook.xlsx.write(res);
}

export function setUp(server : Express) {

    server.get(DOWNLOAD_JSON_URL, function(req:Request, res:Response) {
        returnPromise(res, getAllWithFilters(
            req.params.db_name,
            req.query));
    });

    server.get(DOWNLOAD_XLS_URL, function(req:Request, res:Request) {
        toExcel(req.params.db_name, req, res).then();
    });

    server.get("/db/:db_name", function(req:Request, res:Response) {
        let html = index(req.params.db_name, req);
        returnPromise(res, html);
    });
}
