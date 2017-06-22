import { combineReducers } from "redux";
import { reducer as counter } from "./counter";

const reducers = combineReducers({ counter });

export default reducers;
export { actions as counterActions } from "./counter";
