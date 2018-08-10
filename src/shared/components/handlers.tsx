import * as React from "react";
import {BOOLEAN_TYPE, BooleanType, NUMBER_TYPE, NumberType, TEXT_TYPE, TextType, Type} from "../model/types";
import {Checkbox, Input} from "semantic-ui-react";

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

let textHandler : ValueHandlerType<string, TextType> = (props) =>
    props.editMode ?
        <Input
            value={props.value}
            onChange={(e, data) =>
                props.onValueChange(data.value)} /> :
        <span>{props.value}</span>

let numberHandler : ValueHandlerType<number, NumberType> = (props) =>
    props.editMode ?
        <Input
            value={props.value}
            type="number"
            onChange={(e, data) =>
                props.onValueChange(parseInt(data.value))} /> :
        <span>{props.value}</span>

/** Generic value handler, making the switch */
export const ValueHandler : ValueHandlerType<any, any> = (props) => {
    switch(props.type.tag) {
        case BOOLEAN_TYPE :
            return booleanHandler(props);
        case TEXT_TYPE :
            return textHandler(props);
        case NUMBER_TYPE :
            return numberHandler(props);
        default:
            throw new Error( `Type not supported : ${props.type.tag}`);
    }
}

