import * as React from "react";
import {Provider} from 'react-redux';
import {RecordsPage} from "./jsx/pages/db/records-page";
import {Route, Switch} from 'react-router';
import {RECORDS_PATH, SINGLE_RECORD_PATH} from "./api";
import {SingleRecordPage} from "./jsx/pages/db/single-record-page";
import {GlobalContextProps, GlobalContextProvider} from "./jsx/context/global-context";
import {MainTemplate} from "./jsx/pages/main-template";

/** Global app for single db  */
export const DbApp : React.SFC<GlobalContextProps> = (props) => {
    return <Provider store={props.store} >
            <GlobalContextProvider global={props}>

            <MainTemplate messages={props.messages} >
                <Switch>
                    <Route path={SINGLE_RECORD_PATH} component={SingleRecordPage} />
                    <Route path={RECORDS_PATH} component={RecordsPage} />
                </Switch>
            </MainTemplate>

            </GlobalContextProvider>
        </Provider>
};

