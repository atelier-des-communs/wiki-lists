import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as language from "express-request-language";
import * as session from "express-session";
import {setUp as setUpRest} from "./rest/db";
import {setUp as setUpHtml} from "./html";
import {setUp as setUpExport} from "./export";
import {setUp as setUpAuth} from "./rest/auth";
import {LANGUAGES} from "./i18n/messages";
import {LANG_COOKIE, COOKIE_DURATION} from "../shared/api";
import * as mongoose from "mongoose";
import '../shared/model';
import {config} from "./config";

const MAX_AGE  = 30 * 24 * 3600 * 1000; // One month

const LOGIN_TIME = 7 * 24 * 3600 * 100 // One week

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

    // Pretty print JSON result
    server.set('json spaces', 2);

    // TODO : Use nginx to serve static files instead of NodeJS
    for (let path of dist_paths) {
        server.use('/static', express.static(path, {maxAge: MAX_AGE}));
    }

    setUpAuth(server);
    setUpRest(server);
    setUpExport(server);

    // Should be last, as it contains 404 page
    setUpHtml(server);


    return server;
}

let langSettings =  {
    languages : LANGUAGES.map(lang => lang.key),
    cookie: {name: LANG_COOKIE}};