
// Used to fake document && window for some react components that are not SSR ready
require('jsdom-global')();
require('dotenv').config();

var path = require("path");
var initServer = require("../../dist/server/server.bundle.js").default;

const port = process.env.PORT || 8082;


let dist_path = path.resolve(__dirname, "..", "..", "dist", "client");

var server = initServer(dist_path);

server.listen(port, function() {
	var host = this.address().address;
	console.log("Server launched at http://%s:%s", host, port);
});
