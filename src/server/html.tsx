///<reference path="../shared/utils.ts"/>
import * as React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import {createStore } from "redux";
import {DbApp} from "../shared/app";
import "../shared/favicon.ico";
import {IState, reducers} from "../shared/redux";
import {dbDataFetcher} from "./db/db";
import {Store} from "react-redux";
import {arrayToMap, deepClone, Map, parseParams, toImmutable} from "../shared/utils";
import {Express} from "express";
import {getAccessRights, HttpError, returnPromise} from "./utils";
import {Request, Response} from "express-serve-static-core"
import {cookieName, IMarshalledContext} from "../shared/api";
import {GlobalContextProps, HeadSetter} from "../shared/jsx/context/global-context";
import {AccessRight, SimpleUserRights} from "../shared/access";

const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '' : 'http://localhost:8081';

class ServerSideHeaderHandler implements HeadSetter {
    title = "";
    setTitle(newTitle:string){
        this.title=newTitle
    }
}

async function renderHtml(dbName:string, url: string, store: Store<IState>, rights:AccessRight[]) : Promise<string> {


    let head = new ServerSideHeaderHandler();

    // Render HTML several time, until all async promises have been resolved
    // This is the way we do async data fetching on SS
    // The Redux Store will accumulate state and eventually make the component to render synchronously
    // @BlackMagic
    let appHTML = null;
    do {
        let globalContext: GlobalContextProps = {
            auth: new SimpleUserRights([AccessRight.ADMIN, AccessRight.EDIT, AccessRight.VIEW]),
            store,
            dataFetcher: dbDataFetcher,
            promises: [],
            head: new ServerSideHeaderHandler()
        };

        let app = <StaticRouter
            location={url}
            context={{}}>
            <DbApp {...globalContext} />
        </StaticRouter>;

        appHTML = renderToString(app);

        console.log("Promises", globalContext.promises.length);

        if (globalContext.promises.length == 0) {
            break;
        } else {
            await Promise.all(globalContext.promises);
        }

    } while (true);

    let context : IMarshalledContext = {
        state : store.getState(),
        env: process.env.NODE_ENV,
        rights};


	return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>${head.title}</title>
				<meta name="referrer" content="no-referrer">
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

    let rights = await getAccessRights(db_name, req.cookies[cookieName(db_name)]);

    let state : IState= {
        items: null,
        dbDefinition: null};

    const store = createStore<IState>(
        reducers,
        toImmutable(state));

    return renderHtml(db_name, req.url, store, rights);
}


export function setUp(server : Express) {

    // Admin URL => set cookie and redirect
    server.get("/db/:db_name@:db_pass", function(req:Request, res:Response) {
        res.cookie(cookieName(req.params.db_name), req.params.db_pass, {
            maxAge : 31 * 24 * 3600 * 1000 // one month
        });
        res.redirect(`/db/${req.params.db_name}`);
    });

    server.get("/db/:db_name*", function(req:Request, res:Response) {
        let html = index(req.params.db_name, req);
        returnPromise(res, html);
    });

}
