import * as React from "react";
import {
    Switch,
    Route,
    Link,
    RouteComponentProps
} from 'react-router-dom';
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Navbar from "./components/navbar/navbar";
import NotFound from "./components/404/404";
const styles: any = require("./app.scss");

interface IStyleDict {
    [element: string]: React.CSSProperties
}

const App: React.SFC<React.Props<{}>> = ({children}) => (
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

export default App;
