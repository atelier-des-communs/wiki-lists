import * as React from "react";
import {_} from "../../i18n/messages";
import {Attribute, EnumType, newType, StructType, TextType, Type, Types} from "../../model/types";
import {Modal, Header, Button, Icon, Segment, SegmentGroup, Form, Label, Message, Dropdown, Grid} from "semantic-ui-react";
import {deepClone, Map} from "../../utils";
import {ValidationError, ValidationException} from "../../validators/validators";

const TYPE_OPTIONS = [
    {value: Types.BOOLEAN, text:_.type_boolean, icon: "check square outline"},
    {value: Types.NUMBER, text:_.type_number, icon:"number"},
    {value: Types.ENUM, text:_.type_enum, icon:"list"},
    {value: Types.TEXT, text:_.type_text, icon:"font"}];


interface SchemaDialogProps  {
    onUpdateSchema : (schema: StructType) => Promise<void>;
    schema : StructType;
    close?: () => void;
}

interface TypeFieldProps<T extends Type<any>>  {
    type: T;
    onUpdate : (newValue: T) => void;
}

type TypeFieldExtra<T extends Type<any>> = React.SFC<TypeFieldProps<T>>;

const TextFieldExtra : TypeFieldExtra<TextType> = (props)=> {
    return <Form.Checkbox
        label={_.rich_edit}
        checked={props.type.rich}
        onChange={(e, val) => {
            let type = deepClone(props.type);
            type.rich = val.checked;
            props.onUpdate(type);
        }} />
};

const EnumFieldExtra : TypeFieldExtra<EnumType> = (props)=> {
    return <Form.Input
        label={_.enum_values}
        defaultValue={props.type.values.map(val => val.value).join(", ")}
        placeholder={_.comma_separated}
        onChange={(e, val) => {
            let type = deepClone(props.type);
            type.values = val.value ?
                val.value
                    .split(",")
                    .map(val => (
                        {value:val.trim()}))
                : [];
            props.onUpdate(type);
        }} />
}

function attributeDetailsSwitch  (props: TypeFieldProps<any>) {
    if (props.type) switch(props.type.tag) {
        case Types.ENUM :
            return <EnumFieldExtra {...props} />
        case Types.TEXT :
            return <TextFieldExtra {...props} />
    }
    return null;
}


// Add some properties to the Attribute type
class UIAttribute extends Attribute {
    expanded ?:boolean;
}

export class SchemaDialog extends React.Component<SchemaDialogProps> {

    state : {
        loading: boolean,
        errors:ValidationError[],
        attributes : UIAttribute[]};

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

    async validate() {

        // "Loading" icon
        this.setState({loading:true});

        // Async POST of schema
        try {

            // filter out UI properties of UI
            let attributes = this.state.attributes.map(attr => {
               let res = deepClone(attr);
               delete res.expanded;
               return res;
            });

            let schema = deepClone(this.props.schema);
            schema.attributes = attributes

            await this.props.onUpdateSchema(schema);
            this.props.close();
        } catch (e) {
            if (e.validationErrors) {
                this.setState({errors: e.validationErrors});
            } else {
                // Rethrow
                throw e;
            }
        } finally {
            this.setState({loading:false});
        }
    }

    /** Return label with potential validation errors.
     * Mark the error that have been used */
    labelWithError(key: string, label:string="") {
        let errors = this.state.errors
            .filter(error => error.field == key)
            .map(error => {
                error.shown = true;
                return error.message
            });
        let error = errors.join(",\n");

        if (error) {
            return <>
                <b>{label}</b>
                <br/>
                <span style={{color:"red"}}>{error}</span>
            </>
        } else {
            return label;
        }
    }

    /** List of remaining error messages */
    remainingErrors() {
        let errors = this.state.errors
            .filter(error => !error.shown)
            .map(error => `${error.field} : ${error.message}`)
        return errors.join(",\n");
    }

    changeName(index:number, name:string) {
        this.state.attributes[index].name = name;
        this.forceRedraw()
    }

    addAttribute(typeTag: string) {
        let type = newType(typeTag);
        let attr = new UIAttribute();
        attr.type = type;
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

            let attributeDetails = attributeDetailsSwitch({
                type: attr.type,
                onUpdate: (type) => this.updateType(index, type)});

            return <Segment key={index}>


                <Grid divided="vertically" >
                    <Grid.Row >
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
                                {attr.saved ?
                                attr.name :

                                <Form.Input
                                    size="mini"
                                    label={this.labelWithError(`${index}.name`)}
                                    defaultValue={attr.name}
                                    placeholder={ _.attribute_name}
                                    pattern="[A-Za-z0-9_]*"
                                    onChange={(e, value) => this.changeName(index, value.value)} />}
                            </Header>
                        </Grid.Column>
                        <Grid.Column width={5}>
                            <Label size="large" >
                                <Icon name={typeDescr(attr.type.tag).icon as any} />
                                {typeDescr(attr.type.tag).text}
                            </Label>
                            {attributeDetails &&
                                <Button
                                    basic size="small" compact className="shy"
                                    onClick={() => this.toggleAttr(index)}>
                                    {_.attribute_details }
                                    <Icon name={attr.expanded ? "chevron up" : "chevron down"} />
                                </Button>
                            }
                        </Grid.Column>
                        <Grid.Column width={1}>
                            <Button icon="trash" size="small" onClick={() => this.remove(index) } />
                        </Grid.Column>
                    </Grid.Row>

                    {attributeDetails && attr.expanded &&
                        <Grid.Row  >
                            <Grid.Column>
                                { attributeDetails }
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
            <Modal.Content scrolling >
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


