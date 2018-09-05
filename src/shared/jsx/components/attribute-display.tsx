/*  Popup controlling the display of the attributes */
import * as React from "react";
import {RouteComponentProps} from "react-router"
import {StructType} from "../../model/types";
import {Button} from "semantic-ui-react"
import {AttributeDisplay, extractDisplays, serializeDisplay} from "../../views/display";
import {goTo, parseParams} from "../../utils";
import {_} from "../../i18n/messages";
import {attrLabel, ellipsis} from "../utils/utils";

interface AttributeDisplayComponent extends RouteComponentProps<{}> {
    schema: StructType;
}


export const AttributeDisplayComponent : React.SFC<AttributeDisplayComponent> = (props) => {
    let queryParams = parseParams(props.location.search)
    let displays = extractDisplays(props.schema, queryParams);

    let setDisplay = (attrName : string, display:AttributeDisplay) => {
        let params = serializeDisplay({[attrName]:display});
        goTo(props, params);
    }

    return <>

        <div style={{padding:"1em"}}>
        {props.schema.attributes.map(attr => {

            let display = displays[attr.name] || AttributeDisplay.MEDIUM;

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

            </div>})}
        </div>
    </>
}