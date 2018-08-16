import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as path from "path";
import {setUp as setUpRest} from "./rest";
import {setUp as setUpHtml} from "./html";




export default function server(dist_path:string) {

    var server = express();
    server.use(compression({ threshold: 0 }));
    server.use(bodyParser.json());

    console.log("dist_path", dist_path);
    server.use(express.static(dist_path));

    setUpHtml(server);
    setUpRest(server);

    return server;
}