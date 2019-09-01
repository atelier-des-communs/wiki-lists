import MongoMemoryServer from 'mongodb-memory-server';
import *  as dotenv from "dotenv";
import * as request from "supertest";
import {messages as _} from "../../../server/i18n/en-GB";
dotenv.config({path:"test.env"});

import config from "../../../server/config";
import * as path from "path";
import * as core from "express-serve-static-core";
import * as morgan from "morgan";
import * as fs from "fs";
import * as serverModule from "../../../../dist/server/server.bundle";
import {LOGIN_URL, VALIDATION_ERROR_STATUS_CODE} from "../../../shared/api";

const DB_PORT = 4444;
const SERVER_PORT = 8083;


let client_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "client");
let server_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "server");

let mongod = null;
let server : core.Express = null;

beforeAll(done => {

    let initServer = serverModule.default;

    // Create in memory DB
    mongod = new MongoMemoryServer({instance:{port: DB_PORT}});
    config.DB_PORT = DB_PORT;

    server = initServer([client_path, server_path]);

    server.use(morgan('dev', {stream: fs.createWriteStream('server.log', {'flags': 'w'})}));

    mongod.getConnectionString().then(() => {
        // console.log("Mongo started on port : ", DB_PORT);
        server.listen(SERVER_PORT, () => {
            // console.log("Server started on port : ", SERVER_PORT);
            done();
        });
    });

});

test("Should login", done => {
    return request(server)
        .post(LOGIN_URL)
        .send({
            login:"foo",
            password:"bar"})
        .expect(VALIDATION_ERROR_STATUS_CODE)
        .then(response => {
           expect(response.body)
               .toEqual({
                   email: _.auth.userNotFound})
        });
});

