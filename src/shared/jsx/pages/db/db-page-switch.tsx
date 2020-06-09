// Wrapper for all pages within a specific Db
// Displays a common header (title and description) and handle route switching to other pages

import * as React from 'react';
import {
    DbPathParams,
    DbProps,
    PageProps,
    SingleRecordPathParams,
    UpdateActions,
    UpdateActionsImpl
} from "../../common-props";
import {withGlobalContext} from "../../context/global-context";
import {Route, RouteComponentProps, Switch} from "react-router"
import {createUpdateDbAction} from "../../../redux";
import {RECORDS_ADMIN_PATH, RECORDS_PATH, recordsLink, SINGLE_RECORD_PATH, SUBSCRIPTION_PATH} from "../../../api";
import {RecordsPage} from "./records-page";
import {SingleRecordPage} from "./single-record-page";
import {Header} from "../layout/header";
import {Link} from 'react-router-dom';
import back from "../../../img/back.png";
import {Button, Message} from "semantic-ui-react";
import {AccessRight, hasRight} from "../../../access";
import {nl2br} from "../../utils/utils";
import {getDbName} from "../../../utils";
// FIXME: Find a way to only import this when required
import {SemanticToastContainer} from 'react-semantic-toasts';
import {Footer} from "../layout/main-layout";
import {withAsyncImport} from "../../async/async-import-component";
import localStorage from "local-storage";
import {AsyncDataComponent} from "../../async/async-data-component";
import {SubscriptionComponent} from "./subscription";

export type LightDbPageProps = PageProps<DbPathParams> & DbProps;
export type DbPageProps = LightDbPageProps & UpdateActions;

const HIDE_LINKS_LS_KEY = (db_name:string) => {return `${db_name}_hide_links`};

class _DbPageSwitch extends AsyncDataComponent<PageProps<DbPathParams> & UpdateActions, DbProps>{

    hideLinks() {
        localStorage(HIDE_LINKS_LS_KEY(this.asyncData.db.name), true);
        // force redraw
        this.setState({});
    }

    fetchData(nextProps: DbPageProps, nextState: {}): Promise<DbProps> | DbProps {
        let state = this.props.store.getState();
        if (!state.dbDefinition) {
            // FIXME : caching should be done in dataFEtcher
            return this.props.dataFetcher
                .getDbDefinition(getDbName(this.props))
                .then((dbDef) => {
                    this.props.store.dispatch(createUpdateDbAction(dbDef));
                    return {db:dbDef};
                });
        } else {
            return {db:state.dbDefinition};
        }
    }

    renderLoaded() {

        let props = {...this.props, db: this.asyncData.db};
        let updateActions = new UpdateActionsImpl(props);
        let _ = props.messages;
        let db = this.asyncData.db;

        let base_url = location.protocol + '//' + location.host;

        let private_link = base_url +
            RECORDS_ADMIN_PATH(props.config).
                replace(":db_name", getDbName(props)).
                replace(":db_pass", db.secret);

        let public_link = base_url +
            RECORDS_PATH(props.config).
                replace(":db_name", getDbName(props));

        let hideLinks = localStorage(HIDE_LINKS_LS_KEY(props.db.name));

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
            <SemanticToastContainer position="top-left" animation="fade" />
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

                    <Route path={SUBSCRIPTION_PATH(props.config)} render={(routepprops:RouteComponentProps<DbPathParams>) =>
                        <SubscriptionComponent {...props} {...routepprops} {...updateActions} />}/>

                    <Route path={SINGLE_RECORD_PATH(props.config)} render={(routepprops: RouteComponentProps<SingleRecordPathParams>) =>
                        <SingleRecordPage  {...props} {...routepprops} {...updateActions} />}/>

                    <Route path={RECORDS_PATH(props.config)} render={(routepprops:RouteComponentProps<DbPathParams>) =>
                        <RecordsPage {...props} {...routepprops} {...updateActions} />}/>

                </Switch>
            </div>

            <Footer {...props} />

        </>

    }
}


// Connect to Redux
export const DbPageSwitch = withGlobalContext(_DbPageSwitch);