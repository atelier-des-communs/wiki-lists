import {DbPathParams, PageProps, ReduxEventsProps, SingleRecordProps} from "../common-props";
import {Button} from "semantic-ui-react"
import {SafeClickWrapper} from "../utils/ssr-safe";
import * as React from "react";
import {EditDialog} from "../dialogs/edit-dialog";
import {AccessRight, hasRight} from "../../access";
import {goToUrl} from "../../utils";
import {singleRecordLink} from "../../api";
import {RecordPopup} from "./record-popup";


interface EditButtonsProps extends PageProps<DbPathParams>, SingleRecordProps, ReduxEventsProps {
    hideViewButton?:boolean;
}

export const EditButtons: React.SFC<EditButtonsProps> = (props) => {

    let _ = props.messages;
    let recordId = props.record._id;

    return <Button.Group basic>

        {!props.hideViewButton &&
            <SafeClickWrapper
                trigger={ (onOpen) =>
                    <Button
                        className="shy"
                        icon="eye"
                        title={_.view_item}
                        size="mini" basic compact
                        onClick={onOpen} >
                    </Button>}
                render = {(onClose) =>
                    <RecordPopup
                        {...props}
                        recordId={recordId}
                        onClose={onClose}
                    /> }>
            </SafeClickWrapper>
        }

        {hasRight(props, AccessRight.EDIT) &&
            <SafeClickWrapper
                trigger={(onOpen) =>
                    <Button
                        className="shy"
                        icon="edit"
                        title={_.edit_item}
                        onClick={onOpen}
                        size="mini" basic compact/>}
                    render= {(onClose) =>
                    <EditDialog
                        {...props}
                        record={props.record}
                        schema={props.db.schema}
                        create={false}
                        close={onClose}
                        onUpdate={props.onUpdate} />}>
            </SafeClickWrapper>
        }


        {hasRight(props, AccessRight.DELETE) &&
        <Button
            icon="delete"
            className="shy" size="mini"
            basic compact
            title={_.delete_item}
            onClick={(e) => {
                e.stopPropagation();
                if (confirm(_.confirm_delete)) {
                    props.onDelete(props.record._id);
                }}}
        />}
    </Button.Group>;
}