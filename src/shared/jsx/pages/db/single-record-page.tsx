import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Link} from "react-router-dom";
import {
    DbProps,
    ReduxEventsProps,
    SingleRecordPathParams,
    SingleRecordProps,
    SingleRecordPropsOnly
} from "../../common-props";
import {SingleRecordComponent} from "../../components/single-record-component";
import {DispatchProp} from "react-redux";
import {IState} from "../../../redux";
import {Container, Header, Segment} from "semantic-ui-react";
import {recordName, recordNameStr} from "../../utils/utils";
import {EditButtons} from "../../components/edit-button";
import {GlobalContextProps, withGlobalContext} from "../../context/global-context";
import {connectComponent} from "../../context/redux-helpers";
import {createAddItemAction} from "../../../redux";
import {recordsLink} from "../../../api";
import {toAnnotatedJson} from "../../../serializer";
import {getDbName} from "../../../utils";
import {AsyncDataComponent} from "../../async/async-data-component";
import {Record} from "../../../model/instances";

type SingleRecordPageProps =
    GlobalContextProps &
    DbProps &
    ReduxEventsProps &
    RouteComponentProps<SingleRecordPathParams> &
    DispatchProp<any>;

class _SingleRecordPage extends AsyncDataComponent<SingleRecordPageProps, Record> {

    constructor(props:SingleRecordPageProps) {
        super(props);
    }

    fetchData(nextProps: SingleRecordPageProps, nextState: {}): Promise<Record> | Record {

        let {params} = nextProps.match;
        let state = nextProps.store.getState();

        if (!state.items || !state.items[params.id]) {
            return nextProps.dataFetcher
                .getRecord(getDbName(nextProps), params.id)
                .then((record) => {
                    nextProps.store.dispatch(createAddItemAction(record));
                    return {record:record, large:true};
                });
        } else {
            return state.items[params.id];
        }
    }

    render() {

        let props = this.props;
        let {db, head, messages} = this.props;
        let record = this.asyncData;
        let _ = messages;

        if (!record) {
            // FIXME : loading ?
            return null;
        }

        // Set html HEAD
        head.setTitle(recordNameStr(db.schema, record));

        return <Container>
            <Link to={recordsLink(props.config, db.name)} > « {_.back_to_list}</Link>
            <Segment className="hoverable" >
                <Header as="h2">{ recordName(db.schema, record)}
                    <div style={{float:"right"}} className="super-shy" >
                        <EditButtons {...props} record={record} hideViewButton={true} />
                    </div>
                </Header>
                <SingleRecordComponent {...props} record={record} large={true} />
            </Segment>
        </Container>
    }



}

export let SingleRecordPage = withGlobalContext(_SingleRecordPage);


