import * as React from 'react';
import * as ReactDOM from "react-dom";
import App from "../shared/app";
import { BrowserRouter, RouteComponentProps } from 'react-router-dom'
import { createStore } from "redux";
import { Provider } from "react-redux";
import reducers from '../shared/reducers';
import "../shared/favicon.ico";

const store = createStore(reducers);

ReactDOM.render((
    <BrowserRouter>
        <Provider store={store}>
            <App />
        </Provider>
    </BrowserRouter>
), document.getElementById("app"));
