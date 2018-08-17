import * as React from "react";
import {_} from "../i18n/messages";
import {Attribute, EnumType, newType, StructType, TextType, Type, Types} from "../model/types";
import {Modal, Header, Button, Icon, Segment, SegmentGroup, Form, Label} from "semantic-ui-react";
import {deepClone} from "../utils";

interface SchemaDialogProps  {
    onUpdate : (newValue: StructType) => Promise<void>;
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
        defaultValue={props.type.values.map(val => val.value).join(",")}
        placeholder={_.comma_separated}
        onChange={(e, val) => {
            let type = deepClone(props.type);
            type.values = val.value.split(",").map(val => ({
                value:val
            }));
            props.onUpdate(type);
        }} />
}

const FieldExtraSwitch : TypeFieldExtra<any> = (props)=> {

    if (props.type) switch(props.type.tag) {
        case Types.ENUM :
            return <EnumFieldExtra {...props} />
        case Types.TEXT :
            return <TextFieldExtra {...props} />
    }
    return null;
}


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
        try {
            await this.props.onUpdate(this.state.schema);
            this.props.close();
        } finally {
            this.setState({loading:false});
        }
    }


    changeName(index:number, name:string) {
        this.state.schema.attributes[index].name = name;
        // FIXME : do it the immutable way
        this.setState({schema:this.state.schema});
    }

    newType(index:number, typeTag: string) {
        let type = typeTag == null ? null : newType(typeTag);
        this.updateType(index, type);
    }

    updateType(index:number, type:Type<any>) {
        let attr = this.state.schema.attributes[index];
        attr.type = type;
        this.setState({schema:this.state.schema});
    }

    remove(index:number) {
        this.state.schema.attributes.splice(index, 1);
        this.setState({schema:this.state.schema});
    }

    addAttribute() {
        let attr = new Attribute();
        this.state.schema.attributes.push(attr);
        this.setState({schema:this.state.schema});
    }

    render()  {

        let typeOptions = [
            {value:null, text:_.empty, icon:null},
            {value: Types.BOOLEAN, text:_.type_boolean, icon: "check square outline"},
            {value: Types.NUMBER, text:_.type_number, icon:"number"},
            {value: Types.ENUM, text:_.type_enum, icon:"list"},
            {value: Types.TEXT, text:_.type_text, icon:"font"},
        ]

        function typeDescr(tag:string) {
            return typeOptions.filter(option => option.value == tag)[0]
        }

        // Loop on schema attributes
        let attributes = this.state.schema.attributes.map((attr, index) => {

            return <Segment key={index}>
                <Button
                    floated="right"
                    icon="trash"
                    onClick={() => this.remove(index) } />

                {attr.saved ?
                    <div>
                        <Header >{attr.name}</Header>
                        <Label>
                            <Icon name={typeDescr(attr.type.tag).icon as any} />
                            {typeDescr(attr.type.tag).text}
                            </Label>
                    </div> :
                    <Form.Group>
                            <Form.Input
                                label={_.attribute_name}
                                defaultValue={attr.name}
                                pattern="[A-Za-z0-9_]*"
                                onChange={(e, value) => this.changeName(index, value.value)} />
                            <Form.Select
                                label={_.attribute_type}
                                disabled={attr.saved}
                                defaultValue={attr.type && attr.type.tag}
                                options={typeOptions}
                                onChange={(e, val) => this.newType(index, val.value as string)}
                            />
                    </Form.Group>
                }

                <FieldExtraSwitch
                    type={attr.type}
                    onUpdate={(type) => this.updateType(index, type)} />
            </Segment>
        });

        return <Modal
            closeIcon
            open={true}
            onClose={()=> this.props.close() }>
            <Header icon='edit' content={_.edit_attributes}/>
            <Modal.Content>
                <Form>
                    <SegmentGroup>
                        {attributes}
                    </SegmentGroup>
                </Form>
                <Button
                    content={_.add_attribute}
                    primary
                    icon="add"
                    onClick={() => this.addAttribute()} />
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


