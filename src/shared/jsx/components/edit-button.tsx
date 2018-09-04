import {StructType} from "../../model/types";
import {Record} from "../../model/instances";
import {ReduxEventsProps, DbPageProps, DbPathParams, SingleRecordProps} from "../common-props";
import {_} from "../../i18n/messages";
import {Button} from "semantic-ui-react"
import {SafeClickWrapper} from "../utils/ssr-safe";
import * as React from "react";
import {EditDialog} from "../dialogs/edit-dialog";
import {AccessRight, AuthProvider} from "../../access";
import {goToUrl} from "../../utils";
import {singleRecordLink} from "../../api";


interface EditButtonsProps extends  DbPageProps, SingleRecordProps, ReduxEventsProps {
    hideViewButton?:boolean;
}

export const EditButtons: React.SFC<EditButtonsProps> = (props) => {
    return <Button.Group basic>


        {!props.hideViewButton && <Button
            className="shy"
            icon="eye"
            title={_.view_item}
            size="mini" basic compact
            onClick={(e) => {
                e.stopPropagation();
                goToUrl(props, singleRecordLink(props.dbName, props.record._id))}}/>}

        {props.auth.hasRight(AccessRight.EDIT) &&
        <SafeClickWrapper trigger={
            <Button
                className="shy"
                icon="edit"
                title={_.edit_item}
                size="mini" basic compact/>}>

            <EditDialog
                record={props.record}
                schema={props.schema}
                create={false}
                onUpdate={props.onUpdate}/>
        </SafeClickWrapper>}

        {props.auth.hasRight(AccessRight.DELETE) &&
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