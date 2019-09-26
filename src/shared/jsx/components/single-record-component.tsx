import * as React from "react";
import {SingleRecordProps} from "../common-props";
import {RouteComponentProps} from "react-router"
import {attrLabel, ellipsis, filterAttribute} from "../utils/utils";
import {ValueHandler} from "../type-handlers/editors";
import {Attribute} from "../../model/types";
import {MessagesProps} from "../../i18n/messages";

type SingleRecordComponentProps = SingleRecordProps & RouteComponentProps<{}> & MessagesProps;

const NAME_ELLIPSIS = 20;

export class SingleRecordComponent extends  React.Component<SingleRecordComponentProps>  {

    constructor(props:SingleRecordComponentProps) {
        super(props);
    }

    render()  {

        let props = this.props;

        // Filter out attributes that are part of the name (already shown)
        let filterAttributeFunc = (attr:Attribute) => filterAttribute(props, props.db.schema, props.large ? "details" : "summary")(attr) && !attr.isName;
        let _ = props.messages;
        return <>
        {props.db.schema.attributes
            .filter(filterAttributeFunc).map((attr : Attribute) =>
                <div style={{marginBottom: "0.5em"}}>
                    <b>{
                        props.large ?
                            attrLabel(attr, _) :
                            ellipsis(attrLabel(attr, _), NAME_ELLIPSIS)} </b>

                    &nbsp;

                    {props.large && <br/>}

                    <ValueHandler
                        {...props}
                        editMode={false}
                        value={props.record[attr.name]}
                        type={attr.type} />
                </div>)}
        </>
    }


};