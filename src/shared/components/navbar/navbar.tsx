import * as React from "react";
import { Route, Link } from "react-router-dom";
import Single from './../single/single';

class Navbar extends React.Component<any, any> {
	render() {
		console.log(this.props.match.url);
		return(
			<nav>
				<ul>
					<li><Link to="/single/example">Link to Example component</Link></li>
					<li><Link to="/single/welcome/User/23">Link to Welcome component with params</Link></li>
				</ul>
				<Route path={this.props.match.url + "single"} component={Single}/>
			</nav>
		);
	}
}

export default Navbar;
