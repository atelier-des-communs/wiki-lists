
import { createStore } from "redux";
export * from './modules';
import { default as reducers } from './modules';

const store = createStore(reducers);

export default store;