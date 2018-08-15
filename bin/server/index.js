var express = require("express");
var compress = require("compression");
var path = require("path");
var server = require("../../dist/server/server.bundle.js").default;

const port = process.env.PORT || 8082;
server.listen(port, function() {
	var host = this.address().address;
	console.log("Server launched at http://%s:%s", host, port);
});
