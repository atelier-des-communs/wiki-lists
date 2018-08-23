import {StructType} from "../../model/types";
import {Record} from "../../model/instances";
import {CollectionEventProps} from "./props";
import {_} from "../../i18n/messages";
import {Button} from "semantic-ui-react"
import {SafeClickWrapper} from "../utils/ssr-safe";
import * as React from "react";
import {EditDialog} from "../dialogs/edit-dialog";

export function editButtons(record: Record, props: CollectionEventProps, schema:StructType) {
    return <Button.Group basic>

        <SafeClickWrapper trigger={
            <Button
                className="shy"
                icon="edit"
                title={_.edit_item}
                size="mini" basic compact/>}>

            <EditDialog
                value={record}
                schema={schema}
                create={false}
                onUpdate={props.onUpdate}/>
        </SafeClickWrapper>

        <Button
            icon="delete"
            className="shy" size="mini"
            basic compact
            title={_.delete_item}
            onClick={() => {
            if (confirm(_.confirm_delete)) {
                props.onDelete(record._id);
            }
        }}/>
    </Button.Group>;
}