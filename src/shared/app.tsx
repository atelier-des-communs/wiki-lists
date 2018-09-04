import * as React from "react";
import {Provider} from 'react-redux';
import { RecordsPage } from "./jsx/pages/db/records-page";
import {Route, Switch} from 'react-router';
import {CREATE_DB_PATH, RECORDS_PATH, SINGLE_RECORD_PATH} from "./api";
import {SingleRecordPage} from "./jsx/pages/db/single-record-page";
import {GlobalContextProvider, GlobalContextProps} from "./jsx/context/global-context";

/** Global app for single db  */
export const DbApp : React.SFC<GlobalContextProps> = (props) => {
    return <Provider store={props.store} >
            <GlobalContextProvider global={props}>
                <Switch>
                    <Route path={SINGLE_RECORD_PATH} component={SingleRecordPage} />
                    <Route path={RECORDS_PATH} component={RecordsPage} />
                </Switch>
            </GlobalContextProvider>
        </Provider>
};

