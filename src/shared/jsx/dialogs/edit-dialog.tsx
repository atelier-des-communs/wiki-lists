import * as React from "react";
import {StructType} from "../../model/types";
import {Button, Form, Grid, Header, Icon, Label, Message, Modal} from "semantic-ui-react";
import {ValueHandler} from "../type-handlers/editors";
import {Record, withoutSystemAttributes} from "../../model/instances";
import {attrLabel, typeIsWide} from "../utils/utils";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {ValidationError} from "../../validators/validators";
import {MessagesProps} from "../../i18n/messages";


interface EditDialogProps extends CloseableDialog, MessagesProps{
    create : boolean;
    record : Record;
    onUpdate : (newValue: Object) => Promise<void>;
    schema : StructType;
}

export class EditDialog extends ValidatingDialog<EditDialogProps> {

    state : {
        loading: boolean,
        errors:ValidationError[] };
    record : any;

    static cleanSchema(props:EditDialogProps) :EditDialogProps {
        let {schema, ...otherProps} = props;
        return {
            schema:withoutSystemAttributes(schema),
            ...otherProps};
    }

    constructor(props: EditDialogProps) {
        super(EditDialog.cleanSchema(props));

        // Clone the input object : not modify it until we validate
        this.state =  {
            loading: false,
            errors:[]};

        // copy of the record
        this.record = {...props.record};
    }

    open() {
        let newState = {
            loading:false,
            ... (this.props.create) ?
                {value:{}} : {}};
        this.setState(newState);
    }

    async validateInternal() {
        await this.props.onUpdate(this.record);
    }

    render()  {

        let _ = this.props.messages;

        // Loop on schema attributes
        let attributes = this.props.schema.attributes.filter(attr => !attr.system);
        let fields = attributes.map(attr => {

            // Update record for this attribute upon change
            // Don't update state : we don't want a redraw here
            let callback = (newValue: any) => {
                this.record[attr.name] = newValue;
                console.log("Record edit updated", this.record);
            }

            return <Grid.Column mobile={16} computer={typeIsWide(attr.type) ? 16 : 8}>
            <Form.Field key={attr.name} >
                <Header size="small" title={attr.isMandatory && _.mandatory_attribute}>
                    {attrLabel(attr)}
                    {attr.isMandatory && <Label circular color="red" size="tiny" empty />}
                    </Header>
                <ValueHandler
                    {...this.props}
                    editMode={true}
                    value={this.record[attr.name]}
                    type={attr.type}
                    onValueChange={callback}
                />
                {this.errorLabel(`${attr.name}`)}
            </Form.Field>
            </Grid.Column>

        });

        return <Modal
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

                {this.state.errors.length > 0 ?
                    <Message
                        error
                        header={_.form_error}
                        content={this.remainingErrors()} /> : null }

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


