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
import {COOKIE_PREFIX, RECORDS_ADMIN_PATH, RECORDS_PATH, recordsLink, SINGLE_RECORD_PATH} from "../../../api";
import {RecordsPage} from "./records-page";
import {SingleRecordPage} from "./single-record-page";
import {Header} from "../layout/header";
import {Link} from 'react-router-dom';
import "../../../img/logo.png";
import {Button, Message} from "semantic-ui-react";
import {AccessRight, hasRight} from "../../../access";
import {toTypedObjects} from "../../../serializer";

type DbPageProps =
    PageProps<DbPathParams> &
    DbProps & // mapped from redux react
    ReduxEventsProps &
    DispatchProp<any>;

const HIDE_LINKS_COOKIE = (db_name:string) => {return `${COOKIE_PREFIX}${db_name}_hide_links`};

export class DbPageSwitchInternal extends React.Component<DbPageProps>{

    hideLinks() {
        this.props.cookies.set(HIDE_LINKS_COOKIE(this.props.db.name), "true");
        // force redraw
        this.setState({});
    }

    render() {
        let props = this.props;
        let _ = props.messages;
        let db = props.db

        // Pass down schema and rights to sub components
        let singleRecordPage = (otherProps: any) => <SingleRecordPage {...props} {...otherProps} />
        let recordsPage = (otherProps: any) => <RecordsPage {...props} {...otherProps} />


        let base_url = location.protocol + '//' + location.host;

        let private_link = base_url +
            RECORDS_ADMIN_PATH.
                replace(":db_name", props.match.params.db_name).
                replace(":db_pass", db.secret)

        let public_link = base_url +
            RECORDS_PATH.
                replace(":db_name", props.match.params.db_name);

        let hideLinks = props.cookies.get(HIDE_LINKS_COOKIE(this.props.db.name));

        return <>
            <Header {...props} >
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


                {hasRight(props, AccessRight.ADMIN) && !hideLinks &&
                <Message info>
                    <Button
                        basic compact size="small"
                        icon="close" floated="right" title={_.hide}
                        onClick={() => this.hideLinks() }/>
                    <Message.Header>
                        {_.db_created}
                    </Message.Header>

                    <Message error>
                        <Message.Header>
                            {_.private_link}
                        </Message.Header>
                        <a href={private_link}>{private_link}</a>
                    </Message>

                    <Message positive>
                        <Message.Header>
                            {_.public_link}
                        </Message.Header>
                        <a href={public_link}>{public_link}</a>
                    </Message>

                </Message>}

                <Switch>
                    <Route path={SINGLE_RECORD_PATH} component={singleRecordPage}/>
                    <Route path={RECORDS_PATH} component={recordsPage}/>
                </Switch>
            </div>
        </>
    }
}


// Filter data from Redux store and map it to props
const mapStateToProps = (state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : DbProps => {

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