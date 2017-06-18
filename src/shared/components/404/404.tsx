import * as React from "react";

class NotFoundComponent extends React.Component<any, any> {
	constructor(props:any) {
		super(props);
	}

	render() {
		console.log(this.props.match.url);
		return (
			<div className="404">
				<p>
					Oups, route not found :( [404]
				</p>
			</div>
		);
	}
}

export default NotFoundComponent;