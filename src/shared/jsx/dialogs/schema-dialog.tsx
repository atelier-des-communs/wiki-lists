import * as React from "react";
import {Attribute, StructType} from "../../model/types";
import {Button, Form, Header, Icon, Modal,} from "semantic-ui-react";
import {ValidationErrors} from "../../validators/validators";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {nonSystemAttributes} from "../../model/instances";
import {IMessages} from "../../i18n/messages";
import {AddButtonPosition, AttributeList} from "./parts/attribute-list";
import {ErrorsContext, RemainingErrorsPlaceholder} from "../utils/validation-errors";
import {cloneDeep} from "lodash";

interface SchemaDialogProps extends CloseableDialog {
    messages:IMessages;
    onUpdateSchema : (schema: StructType) => Promise<void>;
    schema : StructType;
    close?: () => void;
}

export class SchemaDialog extends ValidatingDialog<SchemaDialogProps> {

    state : {
        loading: boolean,
        errors:ValidationErrors,
        attributes : Attribute[]};

    constructor(props: SchemaDialogProps) {

        super(props);

        this.state =  {
            loading: false,
            errors:{},

            // Clone the input object : not modify it until we validate
            attributes: nonSystemAttributes(cloneDeep(this.props.schema.attributes))};
    }

    forceRedraw() {
        this.setState({attributes:this.state.attributes});
    }

    async validateInternal() {

        // Remove "new"
        let attributes = this.state.attributes.map(attr => {
           let res = cloneDeep(attr) as any;
           delete res.new;
           return res;
        });

        let schema = cloneDeep(this.props.schema);
        schema.attributes = attributes;

        await this.props.onUpdateSchema(schema);
    }

    render()  {
        let _ = this.props.messages;

        return <ErrorsContext.Provider value={{errors:this.state.errors, displayedErrors:[]}}>
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
                        onUpdateAttributes={(attributes) => {
                            this.state.attributes = attributes;
                            this.forceRedraw(); }}
                    />

                </Form>
            </Modal.Content>
            <Modal.Actions>
                <RemainingErrorsPlaceholder messages={_} />

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


