// Wrapper for all pages within a specific Db
// Displays a common header (title and description) and handle route switching to other pages

import * as React from 'react';
import {DbPathParams, DbProps, RecordsProps, ReduxEventsProps} from "../../common-props";
import {GlobalContextProps} from "../../context/global-context";
import {RouteComponentProps} from "react-router"
import {Map, mapMap, parseParams} from "../../../utils";
import {createAddItemAction, createUpdateDbAction, IState} from "../../../redux";
import {withSystemAttributes} from "../../../model/instances";
import {connectComponent} from "../../context/redux-helpers";
import {applySearchAndFilters} from "../../../views/filters";
import {DispatchProp} from "react-redux";
import {Route, Switch} from 'react-router';
import {RECORDS_PATH, recordsLink, SINGLE_RECORD_PATH} from "../../../api";
import {RecordsPage} from "./records-page";
import {SingleRecordPage} from "./single-record-page";
import {Header} from "../layout/header";
import {Link} from 'react-router-dom';
import "../../../img/logo.png";


type DbPageProps =
    GlobalContextProps &
    DbProps & // mapped from redux react
    RouteComponentProps<DbPathParams> &
    ReduxEventsProps &
    DispatchProp<any>;

export class DbPageSwitchInternal extends React.Component<DbPageProps>{

    render() {
        let props = this.props;
        let _ = props.messages;

        // Pass down schema and rights to sub components
        let singleRecordPage = (otherProps: any) => <SingleRecordPage {...props} {...otherProps} />
        let recordsPage = (otherProps: any) => <RecordsPage {...props} {...otherProps} />

        let goToHome = () => {
            window.location.href = "/";
        };


        return <>
            <Header {...props} >
                <h1>
                    <Link to={recordsLink(props.match.params.db_name)}>
                        {props.dbLabel}
                    </Link>
                </h1>
                <div dangerouslySetInnerHTML={{__html: props.dbDescription}}/>
                <div style={{textAlign: "right"}}>
                    {_.powered_by}
                    <img
                        src="/img/logo.png"
                        width="100"
                        style={{cursor: 'pointer', verticalAlign: "middle"}}
                        onClick={() => goToHome()}/>
                </div>
            </Header>
            <div style={{margin: "1em"}}>


                <Switch>
                    <Route path={SINGLE_RECORD_PATH} component={singleRecordPage}/>
                    <Route path={RECORDS_PATH} component={recordsPage}/>
                </Switch>
            </div>
        </>
    }
}


// Filter data from Redux store and map it to props
const mapStateToProps =(state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : DbProps => {

    // Apply search and sorting
    let params = parseParams(props.location.search);

    return {
        schema:withSystemAttributes(state.dbDefinition.schema, props.messages),
        rights:state.dbDefinition.rights,
        dbLabel:state.dbDefinition.label,
        dbDescription:state.dbDefinition.description}
};

// Async fetch of data
function fetchData(props:GlobalContextProps & RouteComponentProps<DbPathParams>) : Promise<any> {
    let state = props.store.getState();
    if (!state.dbDefinition) {
        return props.dataFetcher
            .getDbDefinition(props.match.params.db_name)
            .then((dbDef) => {
                // Dispatch to Redux
                props.store.dispatch(createUpdateDbAction(dbDef));
            });
    } else {
        return null;
    }
}

// Connect to Redux
export let DbPageSwitch = connectComponent(
    mapStateToProps,
    fetchData)(DbPageSwitchInternal);