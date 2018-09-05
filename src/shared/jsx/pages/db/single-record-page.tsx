import * as React from "react";
import {RouteComponentProps} from "react-router";
import {ReduxEventsProps, SingleRecordPathParams, SingleRecordProps} from "../../common-props";
import {SingleRecordComponent} from "../../components/single-record-component";
import {DispatchProp} from "react-redux";
import {IState} from "../../../redux/index";
import {Container, Header, Segment} from "semantic-ui-react";
import {recordName, recordNameStr} from "../../utils/utils";
import {EditButtons} from "../../components/edit-button";
import {GlobalContextProps} from "../../context/global-context";
import {connectComponent} from "../../context/redux-helpers";
import {createAddItemAction, createUpdateDbAction} from "../../../redux";
import {systemType, withSystemAttributes} from "../../../model/instances";
import {deepClone} from "../../../utils";

type SingleRecordPageProps =
    SingleRecordProps &
    ReduxEventsProps &
    RouteComponentProps<SingleRecordPathParams> &
    GlobalContextProps &
    DispatchProp<any>;


export const SingleRecordPageInternal : React.SFC<SingleRecordPageProps>  = (props) => {

    let {schema, record, head} = props;

    // Set html HEAD
    head.setTitle(recordNameStr(schema, record));

    return <Container>
        <Segment className="hoverable" >
            <Header as="h2">{ recordName(schema, record)}
                <div style={{float:"right"}} className="super-shy" >
                    <EditButtons {...props} hideViewButton={true} />
                </div>
            </Header>
            <SingleRecordComponent {...props} />
        </Segment>
    </Container>

};

// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, routerProps?: RouteComponentProps<SingleRecordPathParams>) : SingleRecordProps => {


    return {
        schema:withSystemAttributes(state.dbDefinition.schema),
        record: state.items[routerProps.match.params.id],
        large:true}
};

function fetchData(props:GlobalContextProps & RouteComponentProps<SingleRecordPathParams>) {
    let res = [];

    let {params} = props.match;

    let state = props.store.getState();

    if (!state.dbDefinition) {
        res.push(props.dataFetcher
            .getDbDefinition(params.db_name)
            .then((dbDef) => {
                // Dispatch to Redux
                props.store.dispatch(createUpdateDbAction(dbDef));
            }));
    }
    if (!state.items || !state.items[params.id]) {
        res.push(props.dataFetcher
            .getRecord(params.db_name, params.id)
            .then((record) => {
                props.store.dispatch(createAddItemAction(record));
            }));
    }
    return res;
}


export let SingleRecordPage = connectComponent(
    mapStateToProps,
    fetchData)(
        SingleRecordPageInternal);


