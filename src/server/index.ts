import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as path from "path";
import {setUp as setUpRest} from "./rest";
import {setUp as setUpHtml} from "./html";
import {setUp as setUpExport} from "./export";


export default function initServer(dist_path:string) {

    var server = express();
    server.use(compression({ threshold: 0 }));
    server.use(bodyParser.json());

    // Pretty print JSON result
    server.set('json spaces', 2);

    console.log("dist_path", dist_path);
    server.use(express.static(dist_path));

    setUpHtml(server);
    setUpRest(server);
    setUpExport(server);

    return server;
}