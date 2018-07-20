import * as React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "../shared/app";
import "../shared/favicon.ico";

function renderHTML(componentHTML: any) {
    let client_script = (process.env.NODE_ENV === "production") ?
        "<script src='/client.bundle.js'></script>" :
        "<script src='http://localhost:8081/client.bundle.js'></script>"

		return `<!DOCTYPE html>
<html>

	<head>
		<meta charset="UTF-8">
		<title>React Isomorphic Starter Kit</title>
		<link rel="stylesheet" href="/client.bundle.css">
		<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css" />
	</head>

	<body>
		<div id="app">${componentHTML}</div>
		${client_script}
	</body>

</html>`;
}

const context = {};

export default function (req: any, res: any) {
	console.log(req.url);
	const componentHTML = (
		<StaticRouter
			location={req.url}
			context={context}
		>
				<App />
		</StaticRouter>
	);
	res.status(200).send(renderHTML(renderToString(componentHTML)));
}
