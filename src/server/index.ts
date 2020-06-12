import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as language from "express-request-language";
import * as session from "express-session";
import {setUp as setUpRest} from "./rest/db";
import {setUp as setUpHtml} from "./html";
import {setUp as setUpExport} from "./export";
import {LANGUAGES} from "./i18n/messages";
import {LANG_COOKIE} from "../shared/api";
import '../shared/model';
import {config} from "./config";
import {parseBool} from "../shared/utils";
import * as responseTime from "response-time";
import {setupAlertHandler} from "./notifications/alerts";

const MAX_AGE  = 30 * 24 * 3600 * 1000; // One month

const LOGIN_TIME = 7 * 24 * 3600 * 100; // One week

export default function initServer(dist_paths:string[]) : express.Express {

    var server = express();
    server.use(compression());
    server.use(bodyParser.json({limit: '100mb'}));
    server.use(cookieParser());
    server.use(session({
        secret: config.SECRET,
        rolling: true,
        resave: true,
        cookie:{
            maxAge: LOGIN_TIME
        }}));
    server.use(language(langSettings));

    // Log every request and time
    server.use(responseTime((req, res, time) => {
        console.info("req:", req.url, " status:", res.statusCode, " time:", time);
    }));

    // Pretty print JSON result
    server.set('json spaces', 2);

    // Static files : may be served by nginx (better)
    if (parseBool(config.SERVE_STATIC)) {
        for (let path of dist_paths) {
            server.use('/static', express.static(path, {maxAge: MAX_AGE}));
        }
    }

    setUpRest(server);
    setUpExport(server);

    // Should be last, as it contains 404 page
    setUpHtml(server);

    setupJobs();

    return server;
}

function setupJobs() {
    setupAlertHandler();
}

let langSettings =  {
    languages : LANGUAGES.map(lang => lang.key),
    cookie: {name: LANG_COOKIE}};