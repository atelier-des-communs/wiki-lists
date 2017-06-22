import { combineReducers, ActionCreatorsMapObject } from 'redux';

export { actions as counterActions } from './counter';
import { reducer as counter } from './counter';

export default combineReducers({ counter });