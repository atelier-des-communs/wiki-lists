import {DbPathParams, PageProps, UpdateActions, SingleRecordProps} from "../common-props";
import {HashLink} from "react-router-hash-link"
import {Button} from "semantic-ui-react"
import {ButtonWrapper, SafeClickWrapper} from "../utils/ssr-safe";
import * as React from "react";
import {EditDialog} from "../dialogs/edit-dialog";
import {AccessRight, hasRight} from "../../access";
import {filterSingle, goTo, goToUrl, updatedQuery} from "../../utils";
import {RecordPopup} from "./record-popup";
import {LocationType, Types} from "../../model/types";
import {viewPortToQuery} from "../pages/db/map";
import {ICoord} from "../../model/geo";


interface EditButtonsProps extends PageProps<DbPathParams>, SingleRecordProps, UpdateActions {
    hideViewButton?:boolean;
}

const RECORD_ZOOM = 18;

export const EditButtons: React.SFC<EditButtonsProps> = (props) => {

    let _ = props.messages;
    let recordId = props.record._id;

    let locationAttr = filterSingle(props.db.schema.attributes, (attr) => attr.type.tag == Types.LOCATION);

    let zoomUrl = () => {
        let point = props.record[locationAttr.name] as ICoord;
        return updatedQuery(props.location.search, viewPortToQuery({
            center: [point.lat, point.lon],
            zoom : RECORD_ZOOM
        }));
    };

    return <Button.Group basic>

        {!props.hideViewButton && <ButtonWrapper
                        className="shy"
                        icon="eye"
                        title={_.view_item}
                        size="mini" basic compact
                        render = {(onClose) =>
                            <RecordPopup
                                {...props}
                                recordId={recordId}
                                onClose={onClose}
                                large={true} />} />}

        {locationAttr && props.record[locationAttr.name] != null && !props.record.loc_approx &&
            <HashLink to={zoomUrl() + "#map"} >
                <Button className="shy"
                icon="map marker"
                title={_.zoom_on_item}
                to={zoomUrl()}
                size="mini" basic compact/>
            </HashLink>
        }

        {hasRight(props, AccessRight.EDIT) &&
        <ButtonWrapper
            className="shy"
            icon="edit"
            title={_.edit_item}
            size="mini" basic compact
            render= {(onClose) =>
                <EditDialog
                     {...props}
                    record={props.record}
                    schema={props.db.schema}
                    create={false}
                    close={onClose}
                    onUpdate={props.onUpdate} />}>
        </ButtonWrapper>}


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
};