import * as React from "react";
import {extractGroupBy} from "../../views/group";
import {Attribute, EnumValue, StructType, TextType, Type, Types} from "../../model/types";
import {AttributeDisplay, extractDisplays} from "../../views/display";
import {RouteComponentProps} from "react-router"
import {Label, Message, Popup} from "semantic-ui-react";
import {parseParams} from "../../utils";
import {Record} from "../../model/instances";
import {IMessages} from "../../i18n/messages";

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

export function restrictedMessage(_:IMessages) {
    return <Message>
        <Message.Header>{_.error}</Message.Header>
        <Message.Content>{_.private_db}</Message.Content>
    </Message>
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
    if (attr == null) {
        return null;
    }
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


function recordNames(schema:StructType, record:Record, str:boolean=false) {
    return schema.attributes
        .filter(attr => attr.isName)
        .map(attr => record[attr.name]);
}

/** Extract text from attributes marked as name, and render it to spans */
export function recordName(schema:StructType, record:Record) {
    return recordNames(schema, record)
        .map(val => <span>{val}&nbsp;</span>);
}

/** Extract text from attributes marked as name, and render it to spans */
export function recordNameStr(schema:StructType, record:Record) {
    return recordNames(schema, record).join(" ");
}

export function anyToBool(val: any) {
    if (val == null) {
        return false;
    }
    if (typeof val == "boolean") {
        return val;
    }
    if (val == "false" || val == 0) return false;
    return true;
}

/** Apply a mapping function recursively on react children */
// FIXME : Result value not used anywere : simple apply would be enough
export function applyRec<T>(children:React.ReactChild, fn: (children: React.ReactChild, index:number) => T) : any[] {
    return React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        if ((child.props as any).children) {
            let childWithChildren = child as React.ReactElement<{children:any}>;
            child = React.cloneElement(childWithChildren, {
                children: applyRec(childWithChildren.props.children, fn)
            });
        }

        return fn(child, index);
    });
}

export const admin_color = "teal";