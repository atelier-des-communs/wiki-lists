import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Link} from "react-router-dom";
import {ReduxEventsProps, SingleRecordPathParams, SingleRecordProps, SingleRecordPropsOnly} from "../../common-props";
import {SingleRecordComponent} from "../../components/single-record-component";
import {DispatchProp} from "react-redux";
import {IState} from "../../../redux/index";
import {Container, Header, Segment} from "semantic-ui-react";
import {recordName, recordNameStr} from "../../utils/utils";
import {EditButtons} from "../../components/edit-button";
import {GlobalContextProps} from "../../context/global-context";
import {connectComponent} from "../../context/redux-helpers";
import {createAddItemAction} from "../../../redux";
import {recordsLink} from "../../../api";
import {toAnnotatedJson} from "../../../serializer";

type SingleRecordPageProps =
    GlobalContextProps &
    SingleRecordProps &
    ReduxEventsProps &
    RouteComponentProps<SingleRecordPathParams> &
    DispatchProp<any>;

export const SingleRecordPageInternal : React.SFC<SingleRecordPageProps>  = (props) => {

    let {db, record, head} = props;
    let _ = props.messages;

    // Set html HEAD
    head.setTitle(recordNameStr(db.schema, record));

    return <Container>
        <Link to={recordsLink(db.name)} > « {_.back_to_list}</Link>
        <Segment className="hoverable" >
            <Header as="h2">{ recordName(db.schema, record)}
                <div style={{float:"right"}} className="super-shy" >
                    <EditButtons {...props} hideViewButton={true} />
                </div>
            </Header>
            <SingleRecordComponent {...props} />
        </Segment>
    </Container>

};

// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, props?: RouteComponentProps<SingleRecordPathParams> & GlobalContextProps) : SingleRecordPropsOnly => {
    let record = toAnnotatedJson(state.items[props.match.params.id]);
    return {record, large:true}
};

function fetchData(props:GlobalContextProps & RouteComponentProps<SingleRecordPathParams>) {

    let {params} = props.match;
    let state = props.store.getState();

    if (!state.items || !state.items[params.id]) {
        return props.dataFetcher
            .getRecord(params.db_name, params.id, props.user, props.messages)
            .then((record) => {
                props.store.dispatch(createAddItemAction(record));
            });
    }
    return null;
}


export let SingleRecordPage = connectComponent(
    mapStateToProps,
    fetchData)(
        SingleRecordPageInternal);


