import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as path from "path";
import {setUp as setUpRest} from "./rest";
import {setUp as setUpHtml} from "./html";

var server = express();
server.use(compression({ threshold: 0 }));
server.use(bodyParser.json());
server.use(express.static(path.resolve(__dirname, "..", "..", "..", "dist", "client")));


setUpHtml(server);
setUpRest(server);

export default server;