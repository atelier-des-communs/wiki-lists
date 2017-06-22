import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { counterActions } from "../../reducers";

const styles = require("./example.css");

interface IProps {
	count: number;
	increment: Function;
	decrement: Function;
	match: any,
	location: any,
	history: any
}

@(connect(
	state => ({ count: state.counter.count }),
	dispatch => bindActionCreators(counterActions, dispatch)
) as any)
class Example extends React.Component<IProps, any> {
	constructor(props: any) {
		super(props);
	}

	componentDidMount() {
		console.log("Client side: componentDidMount()");
	}

	onClick() {
		console.log("Client side: onClick()");
		this.props.increment();
	}

	render() {
		return (
			<div>
				<p className={styles.text}> Example Component: </p>
				<img src={require("./img/react.png")} className={styles.logo} />
				<div>You are clicked {this.props.count} times</div>
				<button onClick={this.onClick.bind(this)}> Click Me </button>
			</div>
		);
	}
}

export default Example;
