import * as React from "react";
import {renderToString} from "react-dom/server";
import {StaticRouter} from "react-router";
import {createStore} from "redux";
import {App} from "../shared/app";
import "../shared/favicon.png";
import {IState, reducers} from "../shared/redux";
import {DbDataFetcher} from "./db/db";
import {toImmutable} from "../shared/utils";
import {Express} from "express";
import {returnPromise} from "./utils";
import {Request, Response} from "express-serve-static-core"
import {COOKIE_DURATION, SECRET_COOKIE, IMarshalledContext, RECORDS_ADMIN_PATH} from "../shared/api";
import {GlobalContextProps, HeadSetter, ICookies} from "../shared/jsx/context/global-context";
import {selectLanguage} from "../shared/i18n/messages";

const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '' : 'http://localhost:8081';

// We render HTML several time to fetch successive depth of Async load (promises)
// This is the max depth we allow before forcing to return the result back to client :
// This usually means that something is wrong (conditional data fetching not well written),
// but we prefer to return this anyway
const MAX_RENDER_DEPTH = 4;
class ServerSideHeaderHandler implements HeadSetter {
    title = "";
    description = "";

    setTitle(newTitle:string){
        this.title=newTitle
    }

    setDescription(description: string) {
        this.description = description;
    }


}

function renderHtml(head:ServerSideHeaderHandler, html:string, context:any=null) {
    return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>${head.title}</title>
				<description>${head.description}</description>
				<meta name="referrer" content="no-referrer">
				<link rel="shortcut icon" type="image/png" href="/img/favicon.png"/>
				<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
				<link rel="stylesheet" href="${BUNDLE_ROOT}/client.bundle.css" />
			</head>
		
			<body>
				<div id="app">${html}</div>
				<script>
					window.__MARSHALLED_CONTEXT__ = ${JSON.stringify(context)};
				</script>
				<script src="${BUNDLE_ROOT}/client.bundle.js"></script>
			</body>
		</html>`
}

async function renderApp(req:Request) : Promise<string> {


    let head = new ServerSideHeaderHandler();

    let lang = selectLanguage(req);

    let state : IState= {
        items: null,
        dbDefinition: null};

    const store = createStore<IState>(
        reducers,
        toImmutable(state));


    let serverCookies : ICookies = {
        get : (name:string) => {
            return req.cookies[name];
        },

        set : () => {
            // Ignore : we should not set cookies on server side
        }
    };

    // Render HTML several time, until all async promises have been resolved
    // This is the way we do async data fetching on SS
    // The Redux Store will accumulate state and eventually make the component to render synchronously
    // @BlackMagic
    let appHTML = null;
    let nbRender = 0;
    do {
        let globalContext: GlobalContextProps = {
            store,
            dataFetcher: new DbDataFetcher(req),
            lang:lang.key,
            messages:lang.messages,
            cookies:serverCookies,
            promises: [],
            head: new ServerSideHeaderHandler()
        };

        appHTML = renderToString(<StaticRouter
            location={req.url}
            context={{}}>
            <App {...globalContext} />
        </StaticRouter>);

        if (globalContext.promises.length == 0) {
            break;
        } else {
            await Promise.all(globalContext.promises);
        }

        nbRender++;
        if (nbRender > MAX_RENDER_DEPTH) {
            console.error(`Exceeded max depth of SSR data fetching ${MAX_RENDER_DEPTH}: returning current HTML`, req.url);
            break;
        }

    } while (true);

    // Object serialized and embedded into final HTML, for passing to client
    let context : IMarshalledContext = {
        state : store.getState(),
        env: process.env.NODE_ENV,
        messages:lang.messages,
        lang:lang.key};

    return renderHtml(
        head,
        appHTML,
        context)
}


export function setUp(server : Express) {

    // Admin URL => set cookie and redirect
    server.get(RECORDS_ADMIN_PATH, function(req:Request, res:Response) {
        res.cookie(SECRET_COOKIE(req.params.db_name), req.params.db_pass, {
            maxAge : COOKIE_DURATION
        });
        res.redirect(`/db/${req.params.db_name}`);
    });


    // Any other request => use React-Routing
    server.get("/*", function(req:Request, res:Response) {
        returnPromise(res, renderApp(req));
    });

}
