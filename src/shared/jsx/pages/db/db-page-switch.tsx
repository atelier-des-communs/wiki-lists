// Wrapper for all pages within a specific Db
// Displays a common header (title and description) and handle route switching to other pages

import * as React from 'react';
import {DbPathParams, DbProps, PageProps, ReduxEventsProps} from "../../common-props";
import {GlobalContextProps} from "../../context/global-context";
import {Route, RouteComponentProps, Switch} from "react-router"
import {createUpdateDbAction, IState} from "../../../redux";
import {withSystemAttributes} from "../../../model/instances";
import {connectComponent} from "../../context/redux-helpers";
import {DispatchProp} from "react-redux";
import {ADMIN_PATH, RECORDS_PATH, recordsLink, SINGLE_RECORD_PATH} from "../../../api";
import {RecordsPage} from "./records-page";
import {SingleRecordPage} from "./single-record-page";
import {Header} from "../layout/header";
import {Link} from 'react-router-dom';
import "../../../img/logo.png";
import {AccessRight, hasDbRight} from "../../../access";
import {toTypedObjects} from "../../../serializer";
import {admin_color, restrictedMessage} from "../../utils/utils";
import {DbAdmin} from "./admin";
import {Button} from "semantic-ui-react";

type DbPageProps =
    PageProps<DbPathParams> &
    DbProps & // mapped from redux react
    ReduxEventsProps &
    DispatchProp<any>;

export class DbPageSwitchInternal extends React.Component<DbPageProps>{


    render() {
        let props = this.props;
        let _ = props.messages;
        let db = props.db

        if (db == null) {
            return restrictedMessage(_);
        }

        // Pass down schema and rights to sub components
        let singleRecordPage = (otherProps: any) => <SingleRecordPage {...props} {...otherProps} />
        let recordsPage = (otherProps: any) => <RecordsPage {...props} {...otherProps} />

        let adminButton = hasDbRight(props.db, props.user, AccessRight.ADMIN) ?
            <Button color={admin_color}
                    icon="cog" size="small"
                    content={_.admin_panel}
                    as={Link} to={ADMIN_PATH.replace(":db_name", props.db.name)} />
            : null;

        return <>
            <Header {...props} extraButtons={adminButton} >
                <h1>
                    <Link to={recordsLink(db.name)}>
                        {db.label}
                    </Link>
                </h1>
                <div>{db.description}</div>

                <div style={{textAlign: "right"}}>
                    {_.powered_by}
                    <Link to="/" >
                        <img
                        src="/static/img/logo.png"
                        width="100"
                        style={{cursor: 'pointer', verticalAlign: "middle"}} />
                    </Link>
                </div>
            </Header>
            <div style={{margin: "1em"}}>

                <Switch>
                    <Route path={ADMIN_PATH} component={() => <DbAdmin {...props} />}/>
                    <Route path={SINGLE_RECORD_PATH} component={singleRecordPage}/>
                    <Route path={RECORDS_PATH} component={recordsPage}/>
                </Switch>
            </div>
        </>
    }
}


// Filter data from Redux store and map it to props
const mapStateToProps = (state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : DbProps => {

    if (!state.dbDefinition) {
        return {db:null};
    }

    // Transform immutable object into "live" one.
    let db = toTypedObjects(state.dbDefinition);

    // FIXME : Might not be the right place to add system properties to schema
    db.schema = withSystemAttributes(db.schema, props.messages);
    return {db}
};

// Async fetch of dbDefinition
function fetchData(props:GlobalContextProps & RouteComponentProps<DbPathParams>) : Promise<any> {
    let state = props.store.getState();
    if (!state.dbDefinition) {
        return props.dataFetcher
            .getDbDefinition(props.match.params.db_name, props.user, props.messages)
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