import * as React from "react";
import { Route, RouteComponentProps } from "react-router-dom";
import Example from './../example/example';
import Welcome from './../welcome/welcome';

interface Props {
	children: React.ReactChild
}

class Single extends React.Component<RouteComponentProps<Props>, any> {
	render() {
		const { props } = this;
		console.log(this.props.match.url);
		return (
			<div className="container">
				{props.children}
				<Route path={this.props.match.url + "/example"} component={Example} />
				<Route path={this.props.match.url + "/welcome/:name/:age"} component={Welcome} />
			</div>
		)
	}
}

export default Single;
