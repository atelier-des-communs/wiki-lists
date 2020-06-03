import * as React from "react";
import {extractGroupBy} from "../../views/group";
import {Attribute, EnumValue, StructType, TextType, Type, Types} from "../../model/types";
import {extractDisplays} from "../../views/display";
import {RouteComponentProps} from "react-router"
import {Label, Popup} from "semantic-ui-react";
import {parseParams} from "../../utils";
import {Record} from "../../model/instances";
import {IMessages} from "../../i18n/messages";
import {FiltersPopup} from "../type-handlers/filters";

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
export function filterAttribute(props: RouteComponentProps<{}>, schema:StructType, context : "details" | "summary") {

    let queryParams = parseParams(props.location.search);
    let displays = extractDisplays(schema, queryParams, context);
    let groupBy = extractGroupBy(queryParams);

    return (attr:Attribute) => {
        return attr.name != groupBy && displays[attr.name];
    }
}

// FIXME hardcoded wide for rich text for now.
// Find better solution then
export function typeIsWide(type:Type<any>) : boolean {
    return (type.tag == Types.TEXT && (type as TextType).rich)
}

/** Use "label" if present, "name" otherwize  replace @key by i18n string */
export function attrLabel(attr:Attribute, _:IMessages) : string {
    if (attr == null) {
        return null;
    }

    // No i18n ? Use attribute technical name
    let res = (_ === null) ? attr.name : attr.label || attr.name;

    if (res[0] == "@") {
        let key = res.substr(1);
        return (_ as any)[key];
    } else {
        return res;
    }
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
};

export function nl2br(text:string) {
   return text.split('\n').map((part, i) => <span key={i}>{part}<br/></span>);
}


function recordNames(schema:StructType, record:Record, str:boolean=false) {
    return schema.attributes
        .filter(attr => attr.isName)
        .map(attr => record[attr.name]);
}

/** Extract text from attributes marked as name, and render it to spans */
export function recordName(schema:StructType, record:Record) {
    return recordNames(schema, record)
        .map((val, i) => <span key={i}>{val}&nbsp;</span>);
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

