import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as language from "express-request-language";
import * as session from "express-session";
const  flash = require("express-flash");
import {setUp as setUpRest} from "./rest/db";
import {setUp as setUpHtml} from "./html";
import {setUp as setUpExport} from "./export";
import {setUp as setUpAuth} from "./rest/auth";
import {supportedLanguages} from "./i18n/messages";
import {LANG_COOKIE, COOKIE_DURATION} from "../shared/api";
import * as mongoose from "mongoose";
import '../shared/model';
import config from "./config";
import * as connectMongo from "connect-mongo";

const MAX_AGE  = 30 * 24 * 3600 * 1000; // One month

const LOGIN_TIME = 7 * 24 * 3600 * 100 // One week

const MongoStore = connectMongo(session);

export default function initServer(dist_paths:string[]) : express.Express {

    var server = express();
    server.use(compression());
    server.use(bodyParser.json());
    server.use(cookieParser());

    server.use(session({
        secret: config.SECRET,
        rolling: true,
        resave: true,
        store : new MongoStore({mongooseConnection:mongoose.connection}),
        cookie:{
            secure: 'auto',
            maxAge: LOGIN_TIME
        }}));
    server.use(flash());
    server.use(language(langSettings));

    // Pretty print JSON result
    server.set('json spaces', 2);

    // TODO : Use nginx to serve sttic files instead of NodeJS
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
    languages : supportedLanguages.map(lang => lang.key),
    cookie: {name: LANG_COOKIE}};