/**
 *  Components showing extra parameters when editing schema attributes
 */
import {EnumType, EnumValue, TextType, Type, Types} from "../../../model/types";
import {deepClone, slug} from "../../../utils";
import * as React from "react";
import {Button, Form, Grid, Header, Label} from "semantic-ui-react";
import {SafePopup} from "../../utils/ssr-safe";
import {default as SketchPicker, SketchPickerProps} from "react-color/lib/components/sketch/Sketch";
import {EditableText} from "../../components/editable-text";
import {IMessages} from "../../../i18n/messages";
import {ErrorPlaceholder} from "../../utils/validation-errors";


const DEFAULT_ENUM_COLOR="#e8e8e8";


interface TypeExtraProps<T extends Type<any>> {
    messages: IMessages,
    type: T,
    onUpdate: (newValue: T) => void,
    errorPrefix ?: string
}

// Generic type for an extra attribute component
type TypeExtraComponent<T extends Type<any>> = React.SFC<TypeExtraProps<T>>;

const TextExtra: TypeExtraComponent<TextType> = (props) => {
    let _ = props.messages;

    return <Grid.Column>
        <Form.Checkbox
            label={_.rich_edit}
            checked={props.type.rich}
            onChange={(e, val) => {
                let type = deepClone(props.type);
                type.rich = val.checked;
                props.onUpdate(type);
            }}/>
    </Grid.Column>
};
const EnumExtra: TypeExtraComponent<EnumType> = (props) => {

    let _ = props.messages;
    let errorPrefix = props.errorPrefix || "";

    // Local copy of type
    let type = deepClone(props.type);

    let editLabel = (label: string, index: number) => {
        type.values[index].label = label;

        // Sync slug name with label, if not already saved
        if (!type.values[index].saved) {
            type.values[index].value = slug(label);
        }
        props.onUpdate(type);
    };

    let editColor = (color: string, index: number) => {
        type.values[index].color = color;
        props.onUpdate(type);
    };

    let addOption = () => {
        let newOption : EnumValue = {value:null};
        type.values.push(newOption);
        props.onUpdate(type);
    };

    let deleteOption = (index:number) => {
        type.values.splice(index, 1);
        props.onUpdate(type);
    };



    return <><Grid.Column>

        <Header as="h4" >
            {_.enum_values}
            <ErrorPlaceholder attributeKey={`${errorPrefix}values`} />
        </Header>

        { /* Loop on enum values */
        type.values.map((enumVal, index) => {

        let color = enumVal.color || DEFAULT_ENUM_COLOR;
        return <div key={index}
                    style={{margin:"0.2em"}}
                    className="hoverable">
            <SafePopup trigger={
                <Label
                    title={_.edit_color}
                    circular size="tiny"
                    style={{
                        backgroundColor: color,
                        cursor:"pointer"}}>
                    &nbsp;&nbsp;
                </Label>}>
                <SketchPicker
                    color={color}
                    disableAlpha={true}
                    onChange={(color) => editColor(color.hex, index)}
                />
            </SafePopup>
            <EditableText
                {...props}
                placeholder={_.option_placeholder + " " + (index+1)}
                as={Label}
                value={enumVal.label}
                onChange={(val) => editLabel(val, index)}
                forceEdit={!enumVal.saved} />
            <Button
                size="mini"
                compact icon="close"
                className="super-shy"
                title={_.delete_option}
                onClick={() => deleteOption(index)}/>

            <ErrorPlaceholder attributeKey={`${errorPrefix}values.${index}.value`}  />
            <ErrorPlaceholder attributeKey={`${errorPrefix}values.${index}.label`}  />
            <br/>
        </div>
    })}

    <Button
        primary icon="add"
        size="small" compact
        onClick={addOption}>
        {_.add_option}
        </Button>


    </Grid.Column>
    <Grid.Column>
    <Form.Checkbox
        label={_.multi_enum}
        checked={props.type.multi}
        onChange={(e, val) => {
            let type = deepClone(props.type);
            type.multi = val.checked;
            props.onUpdate(type);
        }}/>
    </Grid.Column>
    </>
};


// Switch function providing extra panel based on attribute type
export function typeExtraSwitch(props: TypeExtraProps<any>) {
    if (props.type) switch (props.type.tag) {
        case Types.ENUM :
            return <EnumExtra {...props} />
        case Types.TEXT :
            return <TextExtra {...props} />
    }
    return null;
}