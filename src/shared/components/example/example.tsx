import * as React from "react";
import { RouteComponentProps } from "react-router-dom"
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { counterActions } from "../../redux";
import rxConnect from 'rx-connect';

const styles = require("./example.css");

export interface IExampleConnectStateProps {
	count: number;
}

export interface IExampleConnectDispatchProps {
	increment: () => void;
}

const Example = connect<IExampleConnectStateProps, IExampleConnectDispatchProps, RouteComponentProps<{}>>(
	(state, props) => ({ count: state.counter.count }),
	dispatch => bindActionCreators(counterActions, dispatch)
)(({ count, increment }) => (
	<div>
		<p className={styles.text}> Example Component: </p>
		<img src={require("./img/react.png")} className={styles.logo} />
		<div>You are clicked {count} times</div>
		<button onClick={increment}> Click Me </button>
	</div>
));

export default Example;
