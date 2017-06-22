import * as React from "react";
import { RouteComponentProps } from "react-router-dom";

interface RouterProps {
	name: string;
	age: number;
}

const Welcome: React.SFC<RouteComponentProps<RouterProps>> = ({ match: { params } }) => (
			<p> Welcome {params.name} to React world ! [You are {params.age} years old] </p>
);

export default Welcome;
