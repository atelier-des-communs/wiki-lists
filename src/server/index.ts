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



export default function initServer(dist_paths:string[]) {

    var server = express();
    server.use(compression({ threshold: 0 }));
    server.use(bodyParser.json());
    server.use(cookieParser());

    let langSettings =  {
        languages : supportedLanguages.map(lang => lang.key),
        cookie: {name: LANG_COOKIE}};

    server.use(language(langSettings));

    // Pretty print JSON result
    server.set('json spaces', 2);

    for (let path of dist_paths) {
        server.use(express.static(path));
    }

    setUpRest(server);
    setUpExport(server);

    // Should be last, as it contains 404 page
    setUpHtml(server);

    return server;
}