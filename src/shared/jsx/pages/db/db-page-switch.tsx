// Wrapper for all pages within a specific Db
// Displays a common header (title and description) and handle route switching to other pages

import * as React from 'react';
import {DbPathParams, DbProps, PageProps, ReduxEventsProps, SingleRecordPathParams} from "../../common-props";
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
import back from "../../../img/back.png";
import {Button, Message} from "semantic-ui-react";
import {AccessRight, hasRight} from "../../../access";
import {toTypedObjects} from "../../../serializer";
import {nl2br} from "../../utils/utils";
import {getDbName} from "../../../utils";

// FIXME: Find a way to only import this when required
import { SemanticToastContainer } from 'react-semantic-toasts';
import {Footer} from "../layout/main-layout";
import {AboutPage} from "../about";
import {withAsyncImport} from "../../async/async-import-component";
import localStorage from "local-storage";

export type DbPageProps =
    PageProps<DbPathParams> &
    DbProps & // mapped from redux react
    ReduxEventsProps &
    DispatchProp<any>;

const HIDE_LINKS_LS_KEY = (db_name:string) => {return `${db_name}_hide_links`};

class _DbPageSwitch extends React.Component<DbPageProps>{

    hideLinks() {
        localStorage(HIDE_LINKS_LS_KEY(this.props.db.name), true);
        // force redraw
        this.setState({});
    }

    render() {
        let props = this.props;
        let _ = props.messages;
        let db = props.db;

        console.debug("Rendering db page switch with props : ", props);

        if (!db) {
            console.debug("Waiting fetch of schema ...");
            return null;
        }

        let base_url = location.protocol + '//' + location.host;

        let private_link = base_url +
            RECORDS_ADMIN_PATH(props.config).
                replace(":db_name", getDbName(props)).
                replace(":db_pass", db.secret);

        let public_link = base_url +
            RECORDS_PATH(props.config).
                replace(":db_name", getDbName(props));

        let hideLinks = localStorage(HIDE_LINKS_LS_KEY(this.props.db.name));

        let AsyncAboutPage = withAsyncImport(
            () => import("../about").then(
                (module) => module.AboutPage))

        return <>
            <Header {...props} >
                <img src={back} width={250} style={{float:"left"}} />
                <h1>
                    <Link to={recordsLink(props.config, db.name)}>
                        {db.label}
                    </Link>
                </h1>
                <h4>{nl2br(db.description)}</h4>

            </Header>


            <div style={{position:"absolute", right:"1em"}}>
            <SemanticToastContainer position="top-right" animation="fade" />
            </div>

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
                    <Route path="/about" render={(props:RouteComponentProps<DbPathParams>) => <AsyncAboutPage />} />
                    <Route path={SINGLE_RECORD_PATH(props.config)} render={(props: RouteComponentProps<SingleRecordPathParams>) => <SingleRecordPage  {...this.props} {...props} />}/>
                    <Route path={RECORDS_PATH(props.config)} render={(props:RouteComponentProps<DbPathParams>) => <RecordsPage {...this.props} {...props}  />}/>
                </Switch>
            </div>

            <Footer {...props} />

        </>

    }
}


// Filter data from Redux store and map it to props
// FIXME : quite useless => async data is enough
const mapStateToProps = (state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : DbProps => {

    if (!state.dbDefinition) {
        return {db:null}
    }

    // Transform immutable object into "live" one.
    let db = toTypedObjects(state.dbDefinition);

    // FIXME : Might not be the right place to add system properties to schema
    db.schema = withSystemAttributes(db.schema);
    return {db}
};

// Async fetch of dbDefinition
function fetchData(props:GlobalContextProps & RouteComponentProps<DbPathParams>) : Promise<DbProps> | DbProps {
    let state = props.store.getState();
    if (!state.dbDefinition) {
        return props.dataFetcher
            .getDbDefinition(getDbName(props))
            .then((dbDef) => {
                props.store.dispatch(createUpdateDbAction(dbDef));
                return {db:dbDef};
            });
    } else {
        return {db:state.dbDefinition};
    }
}

// Connect to Redux
export let DbPageSwitch = connectComponent(
    mapStateToProps,
    fetchData)(_DbPageSwitch);