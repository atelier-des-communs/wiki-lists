import * as React from "react";
import {_} from "../../i18n/messages";
import {Attribute, newType, StructType, Type, Types} from "../../model/types";
import {
    Checkbox,
    Popup,
    Button,
    Dropdown,
    Form,
    Grid,
    Header,
    Icon,
    Label,
    Message,
    Modal,
    Segment,
    SegmentGroup
} from "semantic-ui-react";
import {deepClone, slug} from "../../utils";
import {ValidationError} from "../../validators/validators";
import {EditableText} from "../components/editable-text";
import {typeExtraSwitch} from "./parts/attribute-extra-components";
import {attrLabel, Info} from "../utils/utils";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";

const TYPE_OPTIONS = [
    {value: Types.BOOLEAN, text:_.type_boolean, icon: "check square outline"},
    {value: Types.NUMBER, text:_.type_number, icon:"number"},
    {value: Types.ENUM, text:_.type_enum, icon:"list"},
    {value: Types.TEXT, text:_.type_text, icon:"font"}];

interface SchemaDialogProps extends CloseableDialog {
    onUpdateSchema : (schema: StructType) => Promise<void>;
    schema : StructType;
    close?: () => void;
}


// Add some UI / Client only properties to the Attribute type
class UIAttribute extends Attribute {
    expanded ?:boolean;
    uid?: number; // Used as React unique "key", since attrirbute name is not yet filled
}

export class SchemaDialog extends ValidatingDialog<SchemaDialogProps> {

    state : {
        loading: boolean,
        errors:ValidationError[],
        attributes : UIAttribute[]};

    // Counter used for filling UID of new attributes
    uid = 0;

    constructor(props: SchemaDialogProps) {
        super(props);

        // Clone the input object : not modify it until we validate
        this.state =  {
            loading: false,
            errors:[],
            attributes: deepClone(this.props.schema.attributes)};
    }

    forceRedraw() {
        this.setState({attributes:this.state.attributes});
    }

    async validateInternal() {

        // filter out UI properties of attributes
        let attributes = this.state.attributes.map(attr => {
           let res = deepClone(attr);
           delete res.expanded;
           delete res.uid;
           return res;
        });

        let schema = deepClone(this.props.schema);
        schema.attributes = attributes;

        await this.props.onUpdateSchema(schema);
    }


    changeLabel(index:number, label:string) {
        this.state.attributes[index].label = label;
        
        // Sync attribute name 
        if (!this.state.attributes[index].saved) {
            this.state.attributes[index].name = slug(label);
        }
        this.forceRedraw();
    }

    addAttribute(typeTag: string) {
        let type = newType(typeTag);
        let attr = new UIAttribute();
        attr.type = type;
        attr.uid = this.uid++;
        attr.expanded = true;
        this.state.attributes.unshift(attr);
        this.forceRedraw();
    }

    updateType(index:number, type:Type<any>) {
        let attr = this.state.attributes[index];
        attr.type = type;
        this.forceRedraw()
    }

    remove(index:number) {
        let attr = this.state.attributes[index];
        if (attr.saved) {
            if (!confirm(_.confirm_attribute_delete)) {
                return;
            }
        }
        this.state.attributes.splice(index, 1);
        this.forceRedraw()
    }


    toggleAttr(attrIndex:number) {
        this.state.attributes[attrIndex].expanded = !this.state.attributes[attrIndex].expanded;
        this.forceRedraw();
    }


    swapAttributes(index1:number, index2:number) {
        let tmp = this.state.attributes[index1];
        this.state.attributes[index1] = this.state.attributes[index2];
        this.state.attributes[index2] = tmp;
        this.forceRedraw();
    }


    moveUp(index:number) {
        if (index <= 0) return;
        this.swapAttributes(index, index -1);
    }

    moveDown(index:number) {
        if (index >= (this.state.attributes.length -1)) return;
        this.swapAttributes(index, index + 1);
    }

    render()  {

        // Get type text from options for a given tag
        function typeDescr(tag:string) {
            return TYPE_OPTIONS.filter(option => option.value == tag)[0]
        }

        // Loop on schema attributes
        let attributes = this.state.attributes.map((attr, index) => {

            // Specific error label generator, for this attribute
            let errorLabel = (key:string) =>  this.errorLabel(`${index}.${key}`);

            // Extra paramaeters for this type
            let typeExtra = typeExtraSwitch({
                type: attr.type,
                onUpdate: (type) => this.updateType(index, type),
                errorLabel : (key) => errorLabel(`type.${key}`)});

            // Extra parameters, common to all attributes
            let attributeExtra = <>
                {attr.type.tag == Types.TEXT && <>
                    <Checkbox
                        checked={attr.isName}
                        label={_.is_name}
                        onChange={(e, val) => {
                            attr.isName = val.checked;
                            if (val.checked) {attr.isMandatory = true}
                            this.forceRedraw();
                        }} />
                    &nbsp;
                    <Info message={_.is_name_help}/>
                </>}
                <Checkbox
                    checked={attr.isMandatory}
                    label={_.is_mandatory}
                    disabled={attr.isName}
                    onChange={(e, val) => {
                        attr.isMandatory = val.checked;
                        this.forceRedraw();
                    }} />
                {typeExtra}
            </>

            return <Segment key={attr.saved ? attr.name : attr.uid} >


                <Grid divided="vertically" >
                    <Grid.Row className="hoverable" >
                        <Grid.Column width={2}>
                            <Button.Group size="mini" compact >
                                <Button size="mini" compact icon="angle up"
                                    onClick={() => this.moveUp(index)}/>
                                <Button size="mini" compact icon="angle down"
                                        onClick={() => this.moveDown(index)}/>
                            </Button.Group>
                        </Grid.Column>
                        <Grid.Column  width={8}>
                            <Header >
                                <EditableText
                                    forceEdit={!attr.saved}
                                    value={attr.label}
                                    placeholder={ _.attribute_name}
                                    onChange={ (value) => this.changeLabel(index, value)} />
                                {errorLabel("name")}
                                {errorLabel("label")}

                            </Header>
                        </Grid.Column>
                        <Grid.Column width={5}>
                            <Label size="large" >
                                <Icon name={typeDescr(attr.type.tag).icon as any} />
                                {typeDescr(attr.type.tag).text}
                            </Label>
                            <Button
                                basic size="small" compact className="shy"
                                onClick={() => this.toggleAttr(index)}>
                                {_.attribute_details }
                                <Icon name={attr.expanded ? "chevron up" : "chevron down"} />
                            </Button>
                        </Grid.Column>
                        <Grid.Column width={1}>
                            <Button icon="trash" size="small" onClick={() => this.remove(index) } />
                        </Grid.Column>
                    </Grid.Row>

                    {attr.expanded &&
                        <Grid.Row  >
                            <Grid.Column>
                                { attributeExtra }
                            </Grid.Column>
                        </Grid.Row>
                    }
                </Grid>

            </Segment>
        });

        let addAttributeButton = <Button.Group color='blue' float="left">
            <Dropdown
                text={_.add_attribute}
                button color="blue"
                labeled icon="add" className="icon"
                options={TYPE_OPTIONS}
                style={{marginTop:"1em", marginBottom:"1em"}}
                onChange={(e, val) => this.addAttribute(val.value as string)}
            />
        </Button.Group>;

        return <Modal
            closeIcon
            open={true}
            onClose={()=> this.props.close() }>
            <Header icon='edit' >
                {_.edit_attributes}
            </Header>
            <Modal.Content >
                <Form>
                    {addAttributeButton}
                    <SegmentGroup>
                        {attributes}
                    </SegmentGroup>
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


