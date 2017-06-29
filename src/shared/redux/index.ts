
import { createStore, compose } from "redux";
export * from './modules';
import { default as reducers } from './modules';


import DevTools from '../components/devtool/devtool';

const enhancer = compose(
    DevTools.instrument()
);

const store = createStore(reducers, enhancer);

export default store;