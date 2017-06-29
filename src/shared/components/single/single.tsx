import * as React from "react";
import { Route, RouteComponentProps, match } from "react-router-dom";
import Example from './../example/example';
import Welcome from './../welcome/welcome';
import Heroes from './../heroes/heroes';



const Single: React.SFC<RouteComponentProps<match<void>>> = ({ match, children }) => (
	<div className="container">
		{children}
		<Route path={match.url + "/example"} component={Example} />
		<Route path={match.url + "/welcome"} component={Welcome} />
		<Route path={match.url + "/heroes"} component={Heroes} />
	</div>
);

export default Single;
