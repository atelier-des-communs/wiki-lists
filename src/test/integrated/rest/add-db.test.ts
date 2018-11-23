import MongoMemoryServer from 'mongodb-memory-server';

import config from "../../../conf";
import * as path from "path";
import {Server} from "http";
import * as serverModule from "../../../../dist/server/server.bundle.js";

const DB_PORT = 4444;
const SERVER_PORT = 8083;
let mongod = null;
let server : Server  = null;

let client_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "client");
let server_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "server");

beforeAll(() => {

    let initServer = serverModule.default;

    // Create in memory DB
    mongod = new MongoMemoryServer({instance:{port: DB_PORT}});
    config.DB_PORT = DB_PORT;
    let exp = initServer([client_path, server_path]);
    server = exp.listen(SERVER_PORT, () => {
        console.log("Server started on port : ", SERVER_PORT);
        setTimeout(() => {
            console.log("Closing server");
            server.close();
        }, 10000);
    });

}, 30000);


test("wait !", () => {

});
