import * as React from "react";
import {extractGroupBy} from "../../views/group";
import {Attribute, StructType, TextType, Type, Types} from "../../model/types";
import {AttributeDisplay, extractDisplays} from "../../views/display";
import {RouteComponentProps} from "react-router"
import {parseParams} from "../../utils";

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