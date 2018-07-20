import * as React from 'react';
import * as ReactDOM from "react-dom";
import App from "../shared/app";
import { BrowserRouter } from 'react-router-dom'
import "../shared/favicon.ico";

ReactDOM.render((
    <BrowserRouter>
        <App />
    </BrowserRouter>
), document.getElementById("app"));
