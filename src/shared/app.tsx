import * as React from "react";
import {connect, Provider, Store} from 'react-redux';
import { IState } from './redux';
import { ConnectedCollectionComponent } from "./components/collection";
import {Button} from "semantic-ui-react";

interface ReduxAppProps {
    store: Store<IState>;
}

/** Inject the store into the app */
export const ReduxApp : React.SFC<ReduxAppProps>= function(props : ReduxAppProps) {
    return (
        <Provider store={props.store}>
            <ConnectedCollectionComponent />
        </Provider>
    );
};
