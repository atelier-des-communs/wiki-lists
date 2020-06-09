import MongoMemoryServer from 'mongodb-memory-server';
import *  as dotenv from "dotenv";
import * as request from "supertest";
import {messages as _} from "../../../server/i18n/en-GB";
dotenv.config({path:"test.env"});

import {ChildProcess, exec} from "child_process";
import {config} from "../../../server/config";
import * as path from "path";
import * as core from "express-serve-static-core";
import * as morgan from "morgan";
import * as fs from "fs";
import * as serverModule from "../../../../dist/server/server.bundle";
import {LOGIN_URL, VALIDATION_ERROR_STATUS_CODE} from "../../../shared/api";
import {SIGINT} from "constants";

let client_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "client");
let server_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "server");

let mongod : MongoMemoryServer = null;
let server : core.Express = null;
let redisProcess : ChildProcess = null;
let smtpProcess : ChildProcess = null;

const SERVER_PORT = 8083;



beforeAll(done => {

    let initServer = serverModule.default;

    // Create in memory DB
    mongod = new MongoMemoryServer({instance:{port: config.DB_PORT}});

    server = initServer([client_path, server_path]);

    server.use(morgan('dev', {stream: fs.createWriteStream('server.log', {'flags': 'w'})}));

    mongod.getConnectionString().then(() => {
        // console.log("Mongo started on port : ", DB_PORT);
        server.listen(SERVER_PORT, () => {
            // console.log("Server started on port : ", SERVER_PORT);
            done();
        });
    });

    // Start REDIS
    redisProcess = exec("redis-server --port " + config.REDIS_PORT, function (error, stdout, stderr) {

        //console.log('stdout: ' + stdout);
        //console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });

    smtpProcess = exec("fake-smtp-server --port", function (error, stdout, stderr) {

        //console.log('stdout: ' + stdout);
        //console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
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

afterAll(() => {
    mongod.stop();
    redisProcess.kill("SIGINT");
})

