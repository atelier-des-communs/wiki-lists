import * as React from "react";
import {renderToString} from "react-dom/server";
import {StaticRouter} from "react-router";
import {createStore} from "redux";
import {App} from "../shared/app";
import "../shared/favicon.png";
import {IState, reducers} from "../shared/redux";
import {DbDataFetcher} from "./db/db";
import {deepClone, toImmutable} from "../shared/utils";
import {Express} from "express";
import {ContentWithStatus, returnPromiseWithCode} from "./utils";
import {Request, Response} from "express-serve-static-core"
import {COOKIE_DURATION, IMarshalledContext, RECORDS_ADMIN_PATH, SECRET_COOKIE} from "../shared/api";
import {GlobalContextProps, HeadSetter, ICookies} from "../shared/jsx/context/global-context";
import {selectLanguage, supportedLanguages} from "./i18n/messages";
import * as escapeHtml from "escape-html";
import {toAnnotatedJson} from "../shared/serializer";

const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '/static' : 'http://localhost:8081/static';

// We render HTML several time to fetch successive depth of Async load (promises)
// This is the max depth we allow before forcing to return the result back to client :
// This usually means that something is wrong (conditional data fetching not well written),
// but we prefer to return this anyway
const MAX_RENDER_DEPTH = 4;


class ServerSideHeaderHandler implements HeadSetter {
    title = "";
    description = "";
    statusCode = 200;

    setTitle(newTitle:string){
        this.title=newTitle
    }

    setDescription(description: string) {
        this.description = description;
    }

    setStatusCode(code:number) {
        this.statusCode = code;
    }
}

function renderHtml(head:ServerSideHeaderHandler, html:string, context:IMarshalledContext=null) {

    let title = escapeHtml(head.title);
    let description = escapeHtml(head.description);

    console.log(`Title : ${head.title} ${title} decr: ${description}`);

    return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				
				<title>${title}</title>
				<meta name="description" content="${description}" />
				
				<meta name="referrer" content="no-referrer">
				<link rel="shortcut icon" type="image/png" href="/static/img/favicon.png"/>
				<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
				<link rel="stylesheet" href="${BUNDLE_ROOT}/client.bundle.css" />
			</head>
		
			<body>
				<div id="app">${html}</div>
				<script>
					window.__MARSHALLED_CONTEXT__ = ${JSON.stringify(toAnnotatedJson(context))};
				</script>
				<script src="${BUNDLE_ROOT}/lang-${context.lang}.js"></script>
				<script src="${BUNDLE_ROOT}/client.bundle.js"></script>
			</body>
		</html>`
}

async function renderApp(req:Request) : Promise<ContentWithStatus> {


    let head = new ServerSideHeaderHandler();

    let lang = selectLanguage(req);

    // Copy supported languages without the messages : they are retrieved from separate JS file
    let supportedLang = supportedLanguages.map((lang) => {
        let res = deepClone(lang);
        delete res.messages;
        return res;
    });

    let state : IState= {
        items: null, // Will be fetched asynchronously
        dbDefinition: null, // Will be fetched asynchronously
        user: req.user};

    const store = createStore(
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
    // This is the way we do async data fetching on SSR
    // The Redux Store will accumulate state and eventually make the component to render synchronously
    // @BlackMagic
    let appHTML : string;
    let nbRender = 0;
    do {
        let globalContext: GlobalContextProps = {
            store,
            dataFetcher: new DbDataFetcher(req),
            lang:lang.key,
            messages:lang.messages,
            cookies:serverCookies,
            promises: [],
            head,
            supportedLanguages:supportedLang
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
        lang:lang.key,
        supportedLanguages:supportedLang};

    let html = renderHtml(
        head,
        appHTML,
        context);
    return {
        content:html,
        statusCode:head.statusCode
    }
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
        returnPromiseWithCode(res, renderApp(req));
    });

}
