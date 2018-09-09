import * as React from "react";
import {renderToString} from "react-dom/server";
import {StaticRouter} from "react-router";
import {createStore} from "redux";
import {DbApp} from "../shared/app";
import "../shared/favicon.png";
import {IState, reducers} from "../shared/redux";
import {dbDataFetcher} from "./db/db";
import {Store} from "react-redux";
import {toImmutable} from "../shared/utils";
import {Express} from "express";
import {getAccessRights, returnPromise} from "./utils";
import {Request, Response} from "express-serve-static-core"
import {cookieName, IMarshalledContext} from "../shared/api";
import {GlobalContextProps, HeadSetter} from "../shared/jsx/context/global-context";
import {AccessRight, SimpleUserRights} from "../shared/access";
import {MainTemplate} from "../shared/jsx/pages/main-template";
import {Container} from "semantic-ui-react";
import {DefaultMessages, Language, selectLanguage} from "../shared/i18n/messages";

const BUNDLE_ROOT = (process.env.NODE_ENV === "production") ?  '' : 'http://localhost:8081';

// We render HTML several time to fetch successive depth of Async load (promises)
// This is the max depth we allow before forcing to return the result back to client :
// This usually means that something is wrong (conditional data fetching not well written),
// but we prefer to return this anyway
const MAX_RENDER_DEPTH = 4;
class ServerSideHeaderHandler implements HeadSetter {
    title = "";
    setTitle(newTitle:string){
        this.title=newTitle
    }
}

function renderHtml(title:string, html:string, context:any=null) {
    return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>${title}</title>
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

async function renderMainApp(
    dbName:string,
    url: string,
    store: Store<IState>,
    rights:AccessRight[],
    lang:Language) : Promise<string> {


    let head = new ServerSideHeaderHandler();

    // Render HTML several time, until all async promises have been resolved
    // This is the way we do async data fetching on SS
    // The Redux Store will accumulate state and eventually make the component to render synchronously
    // @BlackMagic
    let appHTML = null;
    let nbRender = 0;
    do {
        let globalContext: GlobalContextProps = {
            auth: new SimpleUserRights([AccessRight.ADMIN, AccessRight.EDIT, AccessRight.VIEW]),
            store,
            dataFetcher: dbDataFetcher,
            lang:lang.key,
            messages:lang.messages,
            promises: [],
            head: new ServerSideHeaderHandler()
        };

        let app = <StaticRouter
            location={url}
            context={{}}>
            <DbApp {...globalContext} />
        </StaticRouter>;

        appHTML = renderToString(app);

        if (globalContext.promises.length == 0) {
            break;
        } else {
            await Promise.all(globalContext.promises);
        }

        nbRender++;
        if (nbRender > MAX_RENDER_DEPTH) {
            console.error(`Exceeded max depth of SSR data fetching ${MAX_RENDER_DEPTH}: returning current HTML`, url);
            break;
        }

    } while (true);

    // Object serialized and embedded into final HTML, for passing to client
    let context : IMarshalledContext = {
        state : store.getState(),
        env: process.env.NODE_ENV,
        messages:lang.messages,
        lang:lang.key,
        rights};

    return renderHtml(
        head.title,
        appHTML,
        context)
}


async function index(db_name:string, req: Request): Promise<string> {

    let rights = await getAccessRights(db_name, req.cookies[cookieName(db_name)]);

    let state : IState= {
        items: null,
        dbDefinition: null};

    const store = createStore<IState>(
        reducers,
        toImmutable(state));

    return renderMainApp(
        db_name,
        req.url,
        store,
        rights,
        selectLanguage(req));
}

async function notFound(lang:Language) : Promise<string> {

    let _ = lang.messages
    let content = <MainTemplate
            lang={lang.key}
            messages={_}>
        <Container style={{
            textAlign:"center",
            padding:"4em"}}>

            <h1>404 - {_.not_found}</h1>

        </Container>
    </MainTemplate>;
    let html = renderToString(content);
    return renderHtml(_.not_found, html);
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

// Should be set at the end, since Express process rules in order of declaration
export function setUp404(server:Express) {
    server.use(function(req:Request, res:Response) {
        returnPromise(
            res,
            notFound(selectLanguage(req)),
            404);
    });
}
