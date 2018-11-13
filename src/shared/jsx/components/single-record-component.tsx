import * as React from "react";
import {SingleRecordProps} from "../common-props";
import {RouteComponentProps} from "react-router"
import {attrLabel, ellipsis, filterAttribute} from "../utils/utils";
import {ValueHandler} from "../type-handlers/editors";
import {Attribute} from "../../model/types";
import {MessagesProps} from "../../i18n/messages";

type SingleRecordComponentProps = SingleRecordProps & RouteComponentProps<{}> & MessagesProps;

const NAME_ELLIPSIS = 20;

export const SingleRecordComponent : React.SFC<SingleRecordComponentProps> = (props) => {

    // Filter out attributes that are part of the name (already shown)
    let filterAttributeFunc = (attr:Attribute) => filterAttribute(props, props.db.schema)(attr) && !attr.isName;

    return <>
        {props.db.schema.attributes
            .filter(filterAttributeFunc).map((attr : Attribute) =>
                <div style={{marginBottom: "0.5em"}}>
                    <b>{
                        props.large ?
                            attrLabel(attr) :
                            ellipsis(attrLabel(attr), NAME_ELLIPSIS)} </b>

                    &nbsp;

                    {props.large && <br/>}

                    <ValueHandler
                        {...props}
                        editMode={false}
                        value={props.record[attr.name]}
                        type={attr.type} />
                </div>)}
    </>
};