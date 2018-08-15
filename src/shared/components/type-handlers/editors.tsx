import * as React from "react";
import {Types, BooleanType, NumberType, TextType, Type, EnumType} from "../../model/types";
import {Checkbox, Input, Dropdown, Label, FormSelect} from "semantic-ui-react";
import Draft, { htmlToDraft, draftToHtml} from 'react-wysiwyg-typescript';


interface ValueHandlerProps<T, TypeT extends Type<T>> {
    editMode: boolean;
    type: TypeT
    value:T;
    onValueChange : (value:T) => void;
}


/** Handy type for stateless components showing a value */
type ValueHandlerType<T, TypeT extends Type<T>> = React.SFC<ValueHandlerProps<T, TypeT>>;

let booleanHandler : ValueHandlerType<boolean, BooleanType> = (props) =>
    <Checkbox
        disabled={!props.editMode}
        checked={props.value}
        onChange={
            (e, data) => props.onValueChange(data.checked)}>
    </Checkbox>

let textHandler : ValueHandlerType<string, TextType> = (props) => {
    if (props.editMode) {
        if (props.type.rich) {
            return <Draft
                editorState={htmlToDraft(props.value)}
                onEditorStateChange={editorState => this.onValueChange(draftToHtml(editorState))} />
        } else {
            return <Input
                value={props.value}
                onChange={(e, data) => props.onValueChange(data.value)}/>
        }
    } else {
        return <div>{props.value}</div>
    }
}

let numberHandler : ValueHandlerType<number, NumberType> = (props) =>
    props.editMode ?
        <Input
            value={props.value}
            type="number"
            onChange={(e, data) =>
                props.onValueChange(parseInt(data.value))} /> :
        <span>{props.value}</span>

let enumHandler : ValueHandlerType<string, EnumType> = (props) => {
    if (props.editMode) {
        let valuesWithEmpty = [ {value:null}, ...props.type.values];
        let options = valuesWithEmpty.map(enumVal => ({
                text:enumVal.value,
                value:enumVal.value}));


        return <FormSelect
            value={props.value}
            options={options}
            onChange={(e, data) =>
                props.onValueChange(data.value as string)} />
    } else {
        return props.value ? <Label>{props.value}</Label> : null;
    }
}

/** Generic value handler, making the switch */
export const ValueHandler : ValueHandlerType<any, any> = (props) => {
    switch(props.type.tag) {
        case Types.BOOLEAN :
            return booleanHandler(props);
        case Types.TEXT :
            return textHandler(props);
        case Types.NUMBER :
            return numberHandler(props);
        case Types.ENUM:
            return enumHandler(props);
        default:
            throw new Error( `Type not supported : ${props.type.tag}`);
    }
}

