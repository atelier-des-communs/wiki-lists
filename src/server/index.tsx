import * as React from "react";
import { renderToString } from "react-dom/server";
import { match, StaticRouter } from "react-router";
import App from "../shared/app";
import "../shared/favicon.ico";
import { createStore } from "redux";
import { Provider } from "react-redux";
import reducers from '../shared/reducers';

function renderHTML(componentHTML: any) {
	if (process.env.NODE_ENV === "production")
		return `<!DOCTYPE html>
<html>

	<head>
		<meta charset="UTF-8">
		<title>React Isomorphic Starter Kit</title>
		<link rel="stylesheet" href="/client.bundle.css">
	</head>

	<body>
		<div id="app">${componentHTML}</div>

		<script src="/client.bundle.js"></script>
	</body>

</html>`;
	else
		return `<!DOCTYPE html>
<html>

	<head>
		<meta charset="UTF-8">
		<title>React Isomorphic Starter Kit</title>
	</head>

	<body>
		<div id="app">${componentHTML}</div>

		<script src="http://localhost:8081/client.bundle.js"></script>
		<link rel="stylesheet" href="/client.bundle.css">
	</body>

</html>`;
}

const context = {};
const store = createStore(reducers);

export default function (req: any, res: any) {
	console.log(req.url);
	const componentHTML = (
		<StaticRouter
			location={req.url}
			context={context}
		>
			<Provider store={store}>
				<App />
			</Provider>
		</StaticRouter>
	);
	res.status(200).send(renderHTML(renderToString(componentHTML)));
}
