import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as language from "express-request-language";
import {setUp as setUpRest} from "./rest";
import {setUp as setUpHtml, setUp404} from "./html";
import {setUp as setUpExport} from "./export";
import {supportedLanguages} from "../shared/i18n/messages";
import {LANG_COOKIE_NAME} from "../shared/api";



export default function initServer(dist_path:string) {

    var server = express();
    server.use(compression({ threshold: 0 }));
    server.use(bodyParser.json());
    server.use(cookieParser());

    let langSettings =  {
        languages : supportedLanguages.map(lang => lang.key),
        cookie: {name: LANG_COOKIE_NAME}};

    server.use(language(langSettings));

    // Pretty print JSON result
    server.set('json spaces', 2);

    console.log("dist_path", dist_path);
    server.use(express.static(dist_path));

    setUpHtml(server);
    setUpRest(server);
    setUpExport(server);
    setUp404(server);

    return server;
}