import * as React from "react";
import {
    Switch,
    Route,
    Link,
    RouteComponentProps
} from 'react-router-dom';
import { Provider } from 'react-redux';
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Navbar from "./components/navbar/navbar";
import NotFound from "./components/404/404";
import { default as store } from './redux';
const styles: any = require("./app.scss");

interface IStyleDict {
    [element: string]: React.CSSProperties
}

const App: React.SFC<React.ClassAttributes<{}>> = ({ children }) => (
    <div>
        <Header>
            Isomorphic React Starter Kit v2.0
				</Header>

        <Link to="/" className={styles.link}>Go back</Link>
        {children}

        <Footer>
            <p className={styles.footer}>
                Feel free to use it and share it
					</p>
            <p className={styles.footer}>Ayoub ADIB</p>
            <p className={styles.footer}>Twitter: <a href="https://twitter.com/aybadb">aybadb</a></p>
            <p className={styles.footer}>Github: <a href="https://github.com/ayoubdev">https://github.com/ayoubdev</a></p>
        </Footer>
        <Switch>
            <Route path="/" component={Navbar} />
            <Route component={NotFound} />

        </Switch>
    </div>
);

export default function() {
    return (
        <Provider store={store}>
            <App />
        </Provider>
    );
};
