import * as React from "react";
import {Provider} from 'react-redux';
import { RecordsPage } from "./jsx/pages/records";
import {Route, Switch} from 'react-router';
import {RECORDS_PATH, SINGLE_RECORD_PATH} from "./rest/api";
import {SingleRecordPage} from "./jsx/pages/single-record";
import {GlobalContextProps, GlobalContextProvider} from "./jsx/context/context";



/** Inject the store into the app */
export const MainApp : React.SFC<GlobalContextProps>= function(props : GlobalContextProps) {
    return (
        <GlobalContextProvider global={props.global}>
            <Provider store={props.global.store} >
                <Switch>
                    <Route path={SINGLE_RECORD_PATH} component={SingleRecordPage} />
                    <Route path={RECORDS_PATH} component={RecordsPage} />
                </Switch>
            </Provider>
        </GlobalContextProvider>
    );
};
