import * as React from "react";
import {
	BrowserRouter as Router,
	Route,
	Link
} from 'react-router-dom';
import Header from "./header/header";
import Footer from "./footer/footer";
import "./app.scss";

interface IStyleDict {
	[element: string]: React.CSSProperties
}

let styles: IStyleDict = {
	link: {
		display: "block",
		position: "absolute",
		top: "35vh",
		left: "1.5em",
		color: "black",
		backgroundColor: "lightgrey",
		fontSize: "1.5em",
		textDecoration: "none",
		border: "1px solid black"
	},
	footer: {
		color: "white",
		fontSize: "2vmin",
		fontWeight: "bold",
		textAlign: "center"
	}
};

interface AppPropTypes {
	children: React.ReactChild
}

class App extends React.Component<any, any> {
	render() {
		return (
			<Router>
				<div>
					<Header>
						Isomorphic React Starter Kit v2.0
				</Header>

					{this.props.children}
					<Link to="/" style={styles.link}>Go back</Link>

					<Footer>
						<p style={styles.footer}>
							Feel free to use it and share it
					</p>
						<p style={styles.footer}>Ayoub ADIB</p>
						<p style={styles.footer}>Twitter: <a href="https://twitter.com/aybadb">aybadb</a></p>
						<p style={styles.footer}>Github: <a href="https://github.com/ayoubdev">https://github.com/ayoubdev</a></p>
					</Footer>
				</div>
			</Router>
		);
	}
}

export default App;
