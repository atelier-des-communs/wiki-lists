import * as React from "react";
import {StructType} from "../../model/types";
import {Button, Form, Grid, Header, Icon, Label, Message, Modal} from "semantic-ui-react";
import {ValueHandler} from "../type-handlers/editors";
import {Record, nonSystemAttributes} from "../../model/instances";
import {attrLabel, typeIsWide} from "../utils/utils";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {ValidationErrors} from "../../validators/validators";
import {MessagesProps} from "../../i18n/messages";
import {ErrorPlaceholder, RemainingErrorsPlaceholder, ErrorsContext} from "../utils/validation-errors";


interface EditDialogProps extends CloseableDialog, MessagesProps{
    create : boolean;
    record : Record;
    onUpdate : (newValue: Object) => Promise<void>;
    schema : StructType;
}

export class EditDialog extends ValidatingDialog<EditDialogProps> {

    state : {
        loading: boolean,
        errors:ValidationErrors };
    record : any;


    constructor(props: EditDialogProps) {
        super(props);

        // Clone the input object : not modify it until we validate
        this.state =  {
            loading: false,
            errors:{}};

        // copy of the record
        this.record = {...props.record};
    }

    async validateInternal() {
        await this.props.onUpdate(this.record);
    }

    render()  {

        let _ = this.props.messages;

        // Loop on schema attributes
        let attributes = nonSystemAttributes(this.props.schema.attributes);
        let fields = attributes.map(attr => {

            // Update record for this attribute upon change
            // Don't update state : we don't want a redraw here
            let callback = (newValue: any) => {this.record[attr.name] = newValue;};

            return <Grid.Column mobile={16} computer={typeIsWide(attr.type) ? 16 : 8}>
            <Form.Field key={attr.name} >
                <Header
                    size="small"
                    title={attr.isMandatory && _.mandatory_attribute}>

                    {attrLabel(attr, _)}

                    {attr.isMandatory && <Label circular color="red" size="tiny" empty />}
                </Header>

                <ValueHandler
                    {...this.props}
                    editMode={true}
                    value={this.record[attr.name]}
                    type={attr.type}
                    onValueChange={callback} />

                <ErrorPlaceholder attributeKey={attr.name} />

            </Form.Field>
            </Grid.Column>

        });

        return <ErrorsContext.Provider value={{errors:this.state.errors, displayedErrors:[]}}>

        <Modal
            open={true}
            onClose={()=> this.props.close && this.props.close() } >

            <Header icon='edit' content={this.props.create? _.add_item : _.edit_item}/>

            <Modal.Content>
                <Form>
                    <Grid divided>
                        {fields}
                    </Grid>
                </Form>
            </Modal.Content>

            <Modal.Actions>

                <RemainingErrorsPlaceholder messages={_}/>

                <Button color='red' onClick={this.props.close}>
                    <Icon name='remove'/> {_.cancel}
                </Button>
                <Button loading={this.state.loading} color='green' onClick={() => this.validate()}>
                    <Icon name='checkmark'/> {_.save}
                </Button>
            </Modal.Actions>

        </Modal>
        </ErrorsContext.Provider>;

    }


}


