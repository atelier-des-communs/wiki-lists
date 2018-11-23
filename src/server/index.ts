import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as language from "express-request-language";
import {setUp as setUpRest} from "./rest";
import {setUp as setUpHtml} from "./html";
import {setUp as setUpExport} from "./export";
import {supportedLanguages} from "./i18n/messages";
import {LANG_COOKIE} from "../shared/api";

const MAX_AGE  = 30 * 24 * 3600 * 1000; // One month

export default function initServer(dist_paths:string[]) : express.Express {

    var server = express();
    server.use(compression());
    server.use(bodyParser.json());
    server.use(cookieParser());

    let langSettings =  {
        languages : supportedLanguages.map(lang => lang.key),
        cookie: {name: LANG_COOKIE}};

    server.use(language(langSettings));

    // Pretty print JSON result
    server.set('json spaces', 2);

    for (let path of dist_paths) {
        server.use('/static', express.static(path, {maxAge: MAX_AGE}));
    }

    setUpRest(server);
    setUpExport(server);

    // Should be last, as it contains 404 page
    setUpHtml(server);

    return server;
}