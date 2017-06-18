import * as React from "react";
// import { RouteComponentProps } from 'react-router-dom';

interface Props {
	params: {
		name: String,
		age: Number
	},
	children?: React.ReactChild,
	match: any,
	location: any,
	history: any
}

class Welcome extends React.Component<Props, any> {
	constructor(props: Props) {
		super(props);
	}

	render() {
		const { match: { params } } = this.props;

		return (
			<p> Welcome {params.name} to React world ! [You are {params.age} years old] </p>
		);
	}
}

export default Welcome;
