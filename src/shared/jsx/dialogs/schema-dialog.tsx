import * as React from "react";
import {Attribute, StructType} from "../../model/types";
import {Button, Form, Header, Icon, Message, Modal,} from "semantic-ui-react";
import {deepClone} from "../../utils";
import {ValidationError} from "../../validators/validators";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {withoutSystemAttributes} from "../../model/instances";
import {IMessages} from "../../i18n/messages";
import {AddButtonPosition, AttributeList, UIAttribute} from "./parts/attribute-list";
import {RemainingErrorsPO, ErrorsContext} from "../utils/validation-errors";


interface SchemaDialogProps extends CloseableDialog {
    messages:IMessages;
    onUpdateSchema : (schema: StructType) => Promise<void>;
    schema : StructType;
    close?: () => void;
}

export class SchemaDialog extends ValidatingDialog<SchemaDialogProps> {

    state : {
        loading: boolean,
        errors:ValidationError[],
        attributes : Attribute[]};

    // Counter used for filling UID of new attributes
    uid = 0;

    static cleanSchema(props:SchemaDialogProps) : SchemaDialogProps {
        let {schema, ...otherProps} = props;
        return {schema:withoutSystemAttributes(schema), ...otherProps}
    }

    constructor(props: SchemaDialogProps) {

        super(SchemaDialog.cleanSchema(props));

        this.state =  {
            loading: false,
            errors:[],

            // Clone the input object : not modify it until we validate
            attributes: deepClone(this.props.schema.attributes)};
    }

    forceRedraw() {
        this.setState({attributes:this.state.attributes});
    }

    async validateInternal() {

        // filter out UI properties of attributes
        let attributes = this.state.attributes.map(attr => {
           let res = deepClone(attr) as any;
           delete res.expanded;
           delete res.uid;
           delete res.new;
           return res;
        });

        let schema = deepClone(this.props.schema);
        schema.attributes = attributes;

        await this.props.onUpdateSchema(schema);
    }

    render()  {
        let _ = this.props.messages;

        return <ErrorsContext.Provider value={this.state.errors}>
        <Modal
            closeIcon
            open={true}
            onClose={()=> this.props.close() }>
            <Header icon='edit' >
                {_.edit_attributes}
            </Header>


            <Modal.Content >

                <Form>
                    <AttributeList
                        addButtonPosition={AddButtonPosition.TOP}
                        messages={this.props.messages}
                        schema={this.props.schema}
                        onUpdateAttributes={(attributes: UIAttribute[]) => {
                            this.state.attributes = attributes;
                            this.forceRedraw(); }}
                    />

                </Form>
            </Modal.Content>
            <Modal.Actions>
                <RemainingErrorsPO messages={_} />

                <Button color='red' onClick={this.props.close}>
                    <Icon name='remove'/> {_.cancel}
                </Button>
                <Button loading={this.state.loading} color='green' onClick={() => this.validate()}>
                    <Icon name='checkmark'/> {_.save}
                </Button>
            </Modal.Actions>
        </Modal>
        </ErrorsContext.Provider>

    }


}


