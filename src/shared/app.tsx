import * as React from "react";
import {connect, Provider, Store} from 'react-redux';
import { IState } from './redux';
import { ConnectedCollectionComponent } from "./components/collection";

interface ReduxAppProps {
    store: Store<IState>;
}


export interface IMarshalledContext {
    state: IState,
    dbName:string,
    env:string,
}

/** Inject the store into the app */
export const MainApp : React.SFC<ReduxAppProps>= function(props : ReduxAppProps) {
    return (
        <Provider store={props.store} >
            <ConnectedCollectionComponent />
        </Provider>
    );
};
