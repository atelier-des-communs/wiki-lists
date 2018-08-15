import * as React from "react";
import {_} from "../i18n/messages";
import {StructType} from "../model/types";
import {Modal, Header, Button, Icon, Segment, SegmentGroup, Form} from "semantic-ui-react";
import {Map} from "../utils";
import {ValueHandler} from "./type-handlers/editors";
import {createItem, updateItem} from "../rest/client";
import {Record} from "../model/instances";

interface EditDialogProps  {
    create : boolean;
    value : Record;
    onUpdate : (newValue: Object) => void;
    schema : StructType;
    close?: () => void;
};

export class EditDialog extends React.Component<EditDialogProps> {

    state : {
        loading: boolean;
        value:Record};

    constructor(props: EditDialogProps) {
        super(props);

        // Clone the input object : not modify it until we validate
        this.state =  {
            loading: false,
            value: {...props.value}};
    }

    open() {
        let newState = {
            loading:false,
            ... (this.props.create) ?
                {value:{}} : {}};
        this.setState(newState);
    }

    async validate() {

        // "Loading" icon
        this.setState({loading:true});

        // Async POST of new values
        let payload =  this.props.create ?
            await createItem(this.state.value) :
            await updateItem(this.state.value);

        // Update local state
        this.props.onUpdate(payload);
        this.props.close();
    }

    render()  {

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
                        editMode={true}
                        value={this.state.value[attr.name]}
                        type={attr.type}
                        onValueChange={callback}
                    />
                </Form.Field>
            });

            return <Modal open={true}>
                <Header icon='edit' content={_.edit_item}/>
                <Modal.Content>
                    <Form>
                        {fields}
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='red' onClick={this.props.close}>
                        <Icon name='remove'/> {_.cancel}
                    </Button>
                    <Button loading={this.state.loading} color='green' onClick={() => this.validate()}>
                        <Icon name='checkmark'/> {_.save}
                    </Button>
                </Modal.Actions>
            </Modal>;

    }


}


