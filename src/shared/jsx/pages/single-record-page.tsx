import * as React from "react";
import {RouteComponentProps, withRouter} from "react-router";
import {ReduxEventsProps, SingleRecordProps, RecordsProps, SingleRecordPathParams} from "../common-props";
import {SingleRecordComponent} from "../components/single-record-component";
import {connect, Dispatch, DispatchProp} from "react-redux";
import {IState} from "../../redux";
import {Container, Segment, Header} from "semantic-ui-react";
import {recordName} from "../utils/utils";
import {EditButtons} from "../components/edit-button";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {connectPage} from "../context/redux-helpers";

type SingleRecordPageProps =
    SingleRecordProps &
    ReduxEventsProps &
    RouteComponentProps<SingleRecordPathParams> &
    GlobalContextProps &
    DispatchProp<any>;


export const SingleRecordPageInternal : React.SFC<SingleRecordPageProps> = (props) => {
    return <Container>
        <Segment className="hoverable" >
            <Header as="h2">{ recordName(props.schema, props.record)}
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
        schema: state.schema,
        record: state.items[routerProps.match.params.id],
        large:true}
};


export let SingleRecordPage = connectPage(mapStateToProps)(SingleRecordPageInternal);


