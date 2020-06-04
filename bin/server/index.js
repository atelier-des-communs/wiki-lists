
// Used to fake document && window for some react components that are not SSR ready
require('jsdom-global')();
require('dotenv').config();

var path = require("path");
var initServer = require("../../dist/server/server.bundle.js").default;


let client_path = path.resolve(__dirname, "..", "..", "dist", "client");
let server_path = path.resolve(__dirname, "..", "..", "dist", "server");

let serv = initServer([client_path, server_path]).then(function (server) {
	console.log("Server created");
	return server.listen();
});


Promise.all(serv);



