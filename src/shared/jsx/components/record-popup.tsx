import * as React from "react";
import {AsyncDataComponent} from "../async/async-data-component";
import {Record} from "../../model/instances";
import {createUpdateItemAction} from "../../redux";
import {singleRecordLink} from "../../api";
import {recordName} from "../utils/utils";
import {SingleRecordComponent} from "./single-record-component";
import {GlobalContextProps} from "../context/global-context";
import {MessagesProps} from "../../i18n/messages";
import {DbProps} from "../common-props";
import {RouteComponentProps} from "react-router";
import {Link} from 'react-router-dom';
import {Modal} from 'semantic-ui-react';

type RecordPopupProps = GlobalContextProps & MessagesProps & RouteComponentProps<{}> & DbProps & {
    recordId:string,
    onClose : () => void};

export class RecordPopup extends AsyncDataComponent<RecordPopupProps, Record> {

    constructor(props: RecordPopupProps) {
        super(props);
    }

    fetchData(nextProps: RecordPopupProps, nextState: {}): Promise<Record> | Record {
        let record = this.props.store.getState().items[this.props.recordId];
        if (record) {
            return record;
        } else {
            return this.props.dataFetcher.getRecord(this.props.db.name, nextProps.recordId).then(
                (record) => {
                    this.props.store.dispatch(createUpdateItemAction(record));
                    return record;
                });
        }
    }

    render() {
        return <Modal open={true} onClose={this.props.onClose} closeIcon >
            <Modal.Header>
                {(this.asyncData) ?
                    <Link to={singleRecordLink(this.props.db.name, this.asyncData._id)}>
                        {recordName(this.props.db.schema, this.asyncData)}
                    </Link> : null}
            </Modal.Header>

            <Modal.Content>
                {(this.asyncData) ?
                    <SingleRecordComponent
                        {...this.props}
                        record={this.asyncData}
                    /> : null}
            </Modal.Content>

        </Modal>
    }
}