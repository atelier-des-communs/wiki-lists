import MongoMemoryServer from 'mongodb-memory-server';
import {config as dotenv_config} from "dotenv";
import * as request from "supertest";
import {messages as _} from "../../../server/i18n/en-GB";

dotenv_config({path:"test.env"});

import {ChildProcess, exec} from "child_process";
import {config} from "../../../server/config";
import * as path from "path";
import * as core from "express-serve-static-core";
import * as morgan from "morgan";
import * as fs from "fs";
import * as serverModule from "../../../../dist/server/server.bundle";
import {LOGIN_URL, VALIDATION_ERROR_STATUS_CODE} from "../../../shared/api";

let client_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "client");
let server_path = path.resolve(__dirname, "..", "..", "..", "..", "dist", "server");

let mongod : MongoMemoryServer = null;
let server : core.Express = null;
let redisProcess : ChildProcess = null;
let smtpProcess : ChildProcess = null;

function execChild(name: string, command:string) : ChildProcess {
    return exec(command, function (error, stdout, stderr) {
        console.log('stdout:' + name + " : " + stdout);
        console.log('stderr:' + name + " : " + stderr);
        if (error !== null) {
            console.log('error:' + name + " : " + error);
        }
    })
}

async function killall() {
    console.log("Killing all")
    try {
        await mongod.stop();
    } catch (e) {
        console.error(e);
    }
    try {
        if (redisProcess !=null) {
            await redisProcess.kill("SIGINT");
        }
    } catch (e) {
        console.error(e);
    }
    try {
        if (smtpProcess != null) {
            await smtpProcess.kill("SIGINT");
        }
    } catch (e) {
        console.error(e);
    }
}

afterAll(killall)
process.on('exit', killall);

beforeAll(async () => {

    console.log(config)

    let initServer = serverModule.default;

    // Create in memory DB
    mongod = new MongoMemoryServer({
        // debug:true,
        binary: {
            version:"3.6.3"
        },
        instance:{
            ip: "0.0.0.0",
            port: config.DB_PORT}});

    console.log("Mongo server created")

    await mongod.getConnectionString();

    console.log("Mongo server started.");

    // Start REDIS
    redisProcess = execChild("redis", "redis-server --port " + config.REDIS_PORT);

    // Fake SMTP server
    smtpProcess = execChild("smtp",  `fake-smtp-server --smtp-port ${config.SMTP_PORT}`);

    server = initServer([client_path, server_path]);
    server.use(morgan('dev', {stream: fs.createWriteStream('server.log', {'flags': 'w'})}));

    await server.listen(config.PORT);

}, 30000);

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
}, 15000);





