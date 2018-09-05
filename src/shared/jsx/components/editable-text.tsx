import * as React from "react"
import {Input} from "semantic-ui-react";
import {DefaultMessages} from "../../i18n/messages";

interface EditableTextProps {
    messages:DefaultMessages;
    forceEdit?:boolean;
    as?:React.ComponentClass<any>;
    value:string;
    onChange:(val:string)=>void;
    [key:string] : any
}

export class EditableText extends React.Component<EditableTextProps> {
    state: {
        editMode:boolean;
        focus:boolean;
    };
    inputRef: Input;

    constructor(props:EditableTextProps) {
        super(props);
        this.state = {
            editMode:this.props.forceEdit,
            focus:false};
    }

    setStepInputRef = (el:Input) => {
        this.inputRef = el;
    };

    setEditMode(mode:boolean) {
        this.setState({editMode:mode});
        if (mode) {
            this.setState({focus:true})
        }
    }

    componentDidUpdate() {
        // Set focus to input element right away
        if (this.state.editMode && this.state.focus) {
            this.inputRef.focus();
            this.setState({focus:false});
        }
    }

    keyPressed(e:any) {
        if (e.charCode == 13) {
            this.setEditMode(false);
        }
    }

    blur() {
        // when editableTExt is forced to edit, don't switch back to read mode upon out of focus
        if (!this.props.forceEdit) {
            this.setEditMode(false);
        }
    };

    render(){

        let SpanEl = this.props.as;
        let _ = this.props.messages;

        return this.state.editMode ?
            <Input key="edit"
                {... this.props}

                ref={this.setStepInputRef}
                defaultValue={this.props.value}
                onKeyPress={(e:any) => this.keyPressed(e)}
                onBlur={() => this.blur()}
                onChange={(e, change) => this.props.onChange(change.value)} /> :

            (this.props.as ?
            <SpanEl
                key="read"
                className="editable"
                onClick={() => this.setEditMode(true)}>
                {this.props.value || <i>{_.empty}</i>}
            </SpanEl> :

            <span
                key="read"
                className="editable"
                onClick={() => this.setEditMode(true)}>
                {this.props.value || <i>{_.empty}</i>}
            </span>)
    }
}