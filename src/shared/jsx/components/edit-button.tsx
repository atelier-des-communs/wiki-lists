import {DbPathParams, PageProps, ReduxEventsProps, SingleRecordProps} from "../common-props";
import {Button} from "semantic-ui-react"
import {SafeClickWrapper} from "../utils/ssr-safe";
import * as React from "react";
import {EditDialog} from "../dialogs/edit-dialog";
import {AccessRight, hasRight} from "../../access";
import {goToUrl} from "../../utils";
import {singleRecordLink} from "../../api";


interface EditButtonsProps extends PageProps<DbPathParams>, SingleRecordProps, ReduxEventsProps {
    hideViewButton?:boolean;
}

export const EditButtons: React.SFC<EditButtonsProps> = (props) => {
    let _ = props.messages;

    return <Button.Group basic>

        {!props.hideViewButton && <Button
            className="shy"
            icon="eye"
            title={_.view_item}
            size="mini" basic compact
            onClick={(e) => {
                e.stopPropagation();
                goToUrl(props, singleRecordLink(
                    props.match.params.db_name,
                    props.record._id))}}/>}

        {hasRight(props, AccessRight.EDIT) &&
        <SafeClickWrapper trigger={
            <Button
                className="shy"
                icon="edit"
                title={_.edit_item}
                size="mini" basic compact/>}>

            <EditDialog
                {...props}
                record={props.record}
                schema={props.db.schema}
                create={false}
                onUpdate={props.onUpdate}/>
        </SafeClickWrapper>}

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