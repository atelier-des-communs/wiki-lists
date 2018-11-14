import * as React from "react";
import {Provider} from 'react-redux';
import {Route, Switch} from 'react-router';
import {CREATE_DB_PATH, RECORDS_PATH} from "./api";
import {GlobalContextProps, GlobalContextProvider} from "./jsx/context/global-context";
import {NotFoundPage} from "./jsx/pages/not-found";
import {HomePage} from "./jsx/pages/home";
import {DbPageSwitch} from "./jsx/pages/db/db-page-switch";
import {AddDbPageAsync} from "./jsx/pages/add-db";

/** Global app for single db  */
export const App : React.SFC<GlobalContextProps> = (props) => {

    let _ = props.messages;

    return <Provider store={props.store} >

            <GlobalContextProvider {...props}>

                    <Switch>

                        <Route exact path="/" component={HomePage} />
                        <Route exact path={CREATE_DB_PATH} component={AddDbPageAsync} />

                        <Route path={RECORDS_PATH} component={DbPageSwitch} />

                        <Route component={NotFoundPage} />

                    </Switch>

            </GlobalContextProvider>

        </Provider>
};

