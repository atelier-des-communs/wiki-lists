var shared = require("./webpack.shared.js");
const ManifestPlugin = require('webpack-manifest-plugin');
const DynamicCdnWebpackPlugin = require('dynamic-cdn-webpack-plugin');
const moduleToCdn = require('module-to-cdn');

var client = shared.client_config("production","prod.client");
var server = shared.server_config("production", "prod.server");

function resolve(dep, version) {
    console.debug("Resolving", dep, version);
    if (dep === "leaflet") {
        return {
            name : "leaflet",
            var : "L",
            version,
            url : `https://unpkg.com/leaflet@${version}/dist/leaflet.js`
        }
    } else if (dep === "react-leaflet") {
        return {
            name : "react-leaflet",
            var : null,
            version,
            url : `https://cdnjs.cloudflare.com/ajax/libs/react-leaflet/${version}/react-leaflet.min.js`
        }
    } else {
        var res = moduleToCdn(dep, version, {env:"production"});
        console.debug("Resolved by module to cdn", res);
        return res;
    }
}

client.plugins.push(new ManifestPlugin({filename:'manifest.json'}));
client.plugins.push(new DynamicCdnWebpackPlugin({
            only: ["react", "react-dom", "leaflet", "react-router", "react-router-dom", "axios"],
            resolver : resolve}));


module.exports = [client, server];
