import * as React from "react";
import {RouteComponentProps} from "react-router";
import {CollectionEventProps, RecordProps, RecordsProps, SingleRecordRouteProps} from "../components/props";
import {SingleRecordComponent} from "../components/single-record-component";
import {connect, Dispatch} from "react-redux";
import {IState} from "../../redux";
import {Container, Segment} from "semantic-ui-react";

type SingleRecordPageProps = RecordProps & RouteComponentProps<SingleRecordRouteProps>;


export const SingleRecordPageInternal : React.SFC<SingleRecordPageProps> = (props) => {
    return <Container>
        <Segment>
            <SingleRecordComponent {...props} />
        </Segment>
    </Container>
};

// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, routerProps?: RouteComponentProps<SingleRecordRouteProps>) : RecordProps => {
    return {
        schema: state.schema,
        record: state.items[routerProps.match.params.id]}
};

// connect to redux
export let SingleRecordPage = connect<RecordProps, {}, RouteComponentProps<{}>>(
    mapStateToProps, null
)(SingleRecordPageInternal);
