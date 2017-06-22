import * as React from "react";
import { Route, RouteComponentProps, match } from "react-router-dom";
import Example from './../example/example';
import Welcome from './../welcome/welcome';



const Single: React.SFC<RouteComponentProps<match<void>>> = ({match, children}) => (
			<div className="container">
				{children}
				<Route path={match.url + "/example"} component={Example} />
				<Route path={match.url + "/welcome/:name/:age"} component={Welcome} />
			</div>
);

export default Single;
