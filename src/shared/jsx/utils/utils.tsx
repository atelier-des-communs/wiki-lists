import * as React from "react";
import {extractGroupBy} from "../../views/group";
import {Attribute, EnumValue, StructType, TextType, Type, Types} from "../../model/types";
import {AttributeDisplay, extractDisplays} from "../../views/display";
import {RouteComponentProps} from "react-router"
import {Popup, Label} from "semantic-ui-react";
import {parseParams} from "../../utils";
import {_} from "../../i18n/messages";
import {Record} from "../../model/instances";

export function ellipsis(text:string, maxWidth:number= 15) {
    if (text.length > maxWidth) {
        return <span title={text}>
            {text.substr(0, maxWidth)}
            &hellip;
        </span>;
    } else {
        return <span>{text}</span>;
    }
}



// Return a function filtering visible attributes for all kind of views
export function filterAttribute(props: RouteComponentProps<{}>, schema:StructType) {

    let queryParams = parseParams(props.location.search);
    let displays = extractDisplays(schema, queryParams);
    let groupBy = extractGroupBy(queryParams);

    return (attr:Attribute) => {
        return attr.name != groupBy && (displays[attr.name] != AttributeDisplay.HIDDEN);
    }
}

// FIXME hardcoded wide for rich text for now.
// Find better solution then
export function typeIsWide(type:Type<any>) : boolean {
    return (type.tag == Types.TEXT && (type as TextType).rich)
}

/** Use "label" if present, "name" otherwize */
export function attrLabel(attr:Attribute) : string {
    return attr.label || attr.name;
}

/** Use "label" if present, "value" otherwize */
export function enumLabel(enumVal:EnumValue) : string {
    return enumVal.label || enumVal.value;
}

interface InfoProps {
    message:string;
}

export const Info : React.SFC<InfoProps> = (props) => {
    return <Popup trigger={<Label size="small" circular compact color="blue" icon="info" />} >
        {nl2br(props.message)}
    </Popup>
}

export function nl2br(text:string) {
   return text.split('\n').map(part => <>{part}<br/></>);
}


/** Extract text from attributes marked as name, and render it to spans */
export function recordName(schema:StructType, record:Record) {
    return schema.attributes
        .filter(attr => attr.isName)
        .map(attr => <span>{record[attr.name]}&nbsp;</span>);
}