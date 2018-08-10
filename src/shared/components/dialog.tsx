import * as React from "react";
import {_} from "../i18n/messages";
import {StructType} from "../model/types";
import {Modal, Header, Button, Icon, Segment, SegmentGroup, Form} from "semantic-ui-react";
import {Map} from "../utils";
import {ValueHandler} from "./handlers";


type EditDialogProps = {
    editMode : boolean;
    value : Object;
    onUpdate : (newValue: Object) => void;
    schema : StructType;
};

export class EditDialog extends React.Component<EditDialogProps> {

    state : {
        open: boolean;
        value:Map};

    constructor(props: EditDialogProps) {
        super(props);

        // Clone the input object : not modify it until we validate
        this.state =  {
            value: {...props.value},
            open:false};
    }

    open() {
        this.setState({open:true});
    }

    close() {
        this.setState({open:false});
    }

    validate() {
        this.close();
        this.props.onUpdate(this.state.value);
    }

    render()  {

        var dialog = null;
        if (this.state.open) {

            // Loop on schema attributes
            let fields = this.props.schema.attributes.map(attr => {

                // Update state for this field upon change
                let callback = (newValue: any) => {
                    this.state.value[attr.name] = newValue;
                    this.setState(this.state);
                }

                return <Form.Field>
                    <label>{attr.name}</label>
                    <ValueHandler
                        editMode={this.props.editMode}
                        value={this.state.value[attr.name]}
                        type={attr.type}
                        onValueChange={callback}
                    />
                </Form.Field>
            });

            dialog = <Modal open={this.state.open}>
                <Header icon='edit' content={_.edit_item}/>
                <Modal.Content>
                    <Form>
                        {fields}
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='red' onClick={() => this.close()}>
                        <Icon name='remove'/> No
                    </Button>
                    <Button color='green' onClick={() => this.validate()}>
                        <Icon name='checkmark'/> Yes
                    </Button>
                </Modal.Actions>
            </Modal>;
        }


        // Placeholder, shown anyway
        return <div>
                <Icon name="edit" onClick={() => this.open()} />
                {dialog}
            </div>;
    }


}


