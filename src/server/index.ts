import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as language from "express-request-language";
import * as session from "express-session";
import {ServerLoader, ServerSettings} from "@tsed/common";
const  flash = require("express-flash");
import {default as restRouter} from "./rest/db";
import {default as htmlRouter} from "./html";
import {default as exportRouter} from "./export";
import {default as authRouter} from "./rest/auth";
import {supportedLanguages} from "./i18n/messages";
import {LANG_COOKIE, COOKIE_DURATION} from "../shared/api";
import * as mongoose from "mongoose";
import '../shared/model';
import config from "./config";
import * as connectMongo from "connect-mongo";
import {HelloWorld} from "./controllers";
import "@tsed/swagger";


const MAX_AGE  = 30 * 24 * 3600 * 1000; // One month

const LOGIN_TIME = 7 * 24 * 3600 * 100 // One week

const MongoStore = connectMongo(session);

let port = process.env.PORT || 8000;


@ServerSettings({
    port: port,
    mount: {
        "/rest" : HelloWorld
    },
    swagger: [
        {
            path: "/api-docs"
        }
    ]
})
export class Server extends ServerLoader {

    $beforeRoutesInit()  {

        this.app.use(compression());
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());

        this.app.use(session({
            secret: config.SECRET,
            rolling: true,
            resave: true,
            store : new MongoStore({mongooseConnection:mongoose.connection}),
            cookie:{
                secure: 'auto',
                maxAge: LOGIN_TIME
            }}));
        this.app.use(flash());
        this.app.use(language(langSettings));

        // Other routers
        this.app.use(authRouter);
        this.app.use(exportRouter);
        this.app.use(restRouter);

    }

    $afterRoutesInit() {

        // Should be last, as it contains 404 page
        this.app.use(htmlRouter);
    }


}

export default async function initServer(dist_paths:string[]) : Promise<ServerLoader> {
    let server = await ServerLoader.bootstrap(Server);
    // TODO : Use nginx to serve static files instead of NodeJS
    for (let path of dist_paths) {
        server.app.use('/static', express.static(path, {maxAge: MAX_AGE}));
    }
    return server;
}

let langSettings =  {
    languages : supportedLanguages.map(lang => lang.key),
    cookie: {name: LANG_COOKIE}};