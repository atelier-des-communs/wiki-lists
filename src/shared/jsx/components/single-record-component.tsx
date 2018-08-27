import * as React from "react";
import {CollectionEventProps, RecordProps} from "./props";
import {RouteComponentProps, withRouter} from "react-router"
import {Record} from "../../model/instances";
import {ellipsis, filterAttribute} from "../utils/utils";
import {ValueHandler} from "../type-handlers/editors";
import {Attribute} from "../../model/types";

type RecordComponentProps = RecordProps & RouteComponentProps<{}>;

export const SingleRecordComponent : React.SFC<RecordComponentProps> = (props) => {

    let filterAttributeFunc = filterAttribute(props, props.schema);
    return <>
        {props.schema.attributes
            .filter(filterAttributeFunc).map((attr : Attribute) =>
                <div style={{marginBottom: "0.5em"}}>
                    <b>{ellipsis(attr.name, 10)} : </b>
                    <ValueHandler
                        editMode={false}
                        value={props.record[attr.name]}
                        type={attr.type} />
                </div>)}
    </>
};