import * as React from "react";
import {_} from "../i18n/messages";
import {StructType, Types} from "../model/types";
import {Modal, Header, Button, Icon, Segment, SegmentGroup, Form, Input, Dropdown} from "semantic-ui-react";
import {deepClone, Map} from "../utils";
import {ValueHandler} from "./type-handlers/editors";
import {createItem, updateItem} from "../rest/client";
import {Record} from "../model/instances";

interface SchemaDialogProps  {
    onUpdate : (newValue: StructType) => void;
    schema : StructType;
    close?: () => void;
};

export class SchemaDialog extends React.Component<SchemaDialogProps> {

    state : {
        loading: boolean;
        schema:StructType};

    constructor(props: SchemaDialogProps) {
        super(props);

        // Clone the input object : not modify it until we validate
        this.state =  {
            loading: false,
            schema: deepClone(this.props.schema)};
    }

    async validate() {

        // "Loading" icon
        this.setState({loading:true});

        // Async POST of schema
        // let updatedSchema = await updateSchema(this.state.schema);

        // Update local state
       // this.props.onUpdate(updatedSchema);
        this.props.close();
    }

    render()  {

        let typeOptions = [
            {value: Types.BOOLEAN, text:_.type_boolean},
            {value: Types.NUMBER, text:_.type_number},
            {value: Types.ENUM, text:_.type_enum},
            {value: Types.TEXT, text:_.type_text},
        ]

            // Loop on schema attributes
            let attributes = this.props.schema.attributes.map(attr => {
                return <Segment>
                    <Form.Field>
                        <Input value={attr.name} />
                    </Form.Field>
                    <Form.Field>
                        <Dropdown value={attr.type && attr.type.tag} selection options={typeOptions}/>
                    </Form.Field>
                </Segment>
            });

            return <Modal open={true}>
                <Header icon='edit' content={_.edit_item}/>
                <Modal.Content>
                    <SegmentGroup>
                        {attributes}
                    </SegmentGroup>
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


