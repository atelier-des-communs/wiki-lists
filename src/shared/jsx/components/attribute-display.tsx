/*  Popup controlling the display of the attributes */
import * as React from "react";
import {RouteComponentProps} from "react-router"
import {Attribute, StructType} from "../../model/types";
import {Button, Header} from "semantic-ui-react"
import {AttributeDisplay, extractDisplays, serializeDisplay} from "../../views/display";
import {goTo, parseParams} from "../../utils";
import {attrLabel, ellipsis} from "../utils/utils";
import {IMessages} from "../../i18n/messages";

interface AttributeDisplayComponent extends RouteComponentProps<{}> {
    schema: StructType;
    messages:IMessages;
}


export const AttributeDisplayComponent : React.SFC<AttributeDisplayComponent> = (props) => {
    let {schema} = props;
    let _ = props.messages;
    let queryParams = parseParams(props.location.search);
    let displays = extractDisplays(props.schema, queryParams);

    let setDisplay = (attrName : string, display:AttributeDisplay) => {
        let params = serializeDisplay({[attrName]:display}, schema);
        goTo(props, params);
    };

    let singleAttrDisplay = (attr:Attribute) => {
        let display = displays[attr.name];

        return <div key={attr.name} style={{paddingBottom:"0.5em"}}>
            <Button.Group basic  compact size="small" as="span">
                <Button icon="unhide"
                        compact size="small"
                        title={_.show_attribute}
                        active={display == AttributeDisplay.MEDIUM}
                        onClick={() => setDisplay(attr.name, AttributeDisplay.MEDIUM)} />
                <Button icon="hide"
                        compact size="small"
                        title={_.hide_attribute}
                        active={display == AttributeDisplay.HIDDEN}
                        onClick={() => setDisplay(attr.name, AttributeDisplay.HIDDEN)} />
            </Button.Group>

            <span style={{marginLeft:"1em"}} ><b>{ellipsis(attrLabel(attr))}</b></span>

        </div>}

    return <>
        <div style={{padding:"1em"}}>

            {schema.attributes
                .filter(attr => !attr.system)
                .map(singleAttrDisplay)}

            <Header as="h4">{_.system_attributes}</Header>


            {schema.attributes
                .filter(attr => attr.system)
                .map(singleAttrDisplay)}

        </div>
    </>
}