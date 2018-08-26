import * as React from "react";
import {connect, Provider, Store} from 'react-redux';
import { IState } from './redux';
import { RecordsPage } from "./jsx/pages/records";
import {Route, Switch} from 'react-router';
import {RECORDS_PATH, SINGLE_RECORD_PATH} from "./rest/api";
import {SingleRecordPage} from "./jsx/pages/single-record";

interface ReduxAppProps {
    store: Store<IState>;
}


export interface IMarshalledContext {
    state: IState,
    env:string,
}


/** Inject the store into the app */
export const MainApp : React.SFC<ReduxAppProps>= function(props : ReduxAppProps) {
    return (
        <Provider store={props.store} >
            <Switch>
                <Route path={SINGLE_RECORD_PATH} component={SingleRecordPage} />
                <Route path={RECORDS_PATH} component={RecordsPage} />
            </Switch>
        </Provider>
    );
};
