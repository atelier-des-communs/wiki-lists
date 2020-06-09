import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Button, Container, Item} from "semantic-ui-react";
import {Link} from "react-router-dom";
import {BASE_DB_PATH, CREATE_DB_PATH, LOGIN_PAGE_PATH, RECORDS_PATH, SEND_CONNECT_LINK} from "../../api";
import {MainLayout} from "./layout/main-layout";
import {DbPathParams, PageProps, ReduxEventsProps} from "../common-props";
import { createUpdateDbsAction, IState} from "../../redux";
import {RouteComponentProps} from "react-router";
import {toTypedObjects} from "../../serializer";
import {connectComponent} from "../context/redux-helpers";
import {DispatchProp} from "react-redux";
import {DbDefinition} from "../../model/db-def";
import {mapMap, mapValues} from "../../utils";

interface DBs {
    dbs : DbDefinition[];
}

type HomePageProps =
    PageProps<DbPathParams> &
    DBs & // mapped from redux react
    ReduxEventsProps &
    DispatchProp<any>;

class HomePageInternal extends React.Component<HomePageProps> {

    render() {
        let props = this.props;
        let _ = props.messages;

        props.head.setTitle(`${props.config.site_name} | ${_.site_title}`);

        return <MainLayout {...props} >
            <Container>
                <Item.Group link divided>
                    {props.dbs.map(db =>
                        <Item >
                            <Item.Content as="a" href={ RECORDS_PATH.replace(":db_name", db.name) }>
                            <Item.Header >
                                {db.label}
                            </Item.Header>
                            <Item.Description>
                                {db.description}
                            </Item.Description>
                            </Item.Content>
                        </Item>)}

                </Item.Group>

                { props.user ? <Button
                    positive
                    as={Link}
                    to={CREATE_DB_PATH}
                    content={_.create_db}
                    icon="add" /> :
                    <Button
                        primary
                        as={Link}
                        to={LOGIN_PAGE_PATH}
                        content={_.connect_to_create_db}
                        icon="add" />
                }
            </Container>

        </MainLayout>
    }
}

// Filter data from Redux store and map it to props
const mapStateToProps = (state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : DBs => {

    // Transform immutable object into "live" one.
    let dbs = toTypedObjects(state.dbDefinitions);

    return {dbs: mapValues(dbs)}
};

// Async fetch of dbDefinition
function fetchData(props:GlobalContextProps & RouteComponentProps<{}>) : Promise<any> {
    let state = props.store.getState();
    if (!state.dbDefinitions) {
        return props.dataFetcher
            .listDbDefinitions(props.user)
            .then((dbDefs) => {
                // Dispatch to Redux
                props.store.dispatch(createUpdateDbsAction(dbDefs));
            });
    } else {
        return null;
    }
}

// Connect to Redux
export let HomePage = connectComponent(
    mapStateToProps,
    fetchData)(HomePageInternal);
