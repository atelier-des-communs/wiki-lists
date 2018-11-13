import * as React from "react";
import {Attribute, newType, StructType, Type, Types} from "../../../model/types";
import {Button, Checkbox, Dropdown, Grid, Header, Icon, Label, Segment, SegmentGroup} from "semantic-ui-react";
import {deepClone, slug} from "../../../utils";
import {EditableText} from "../../components/editable-text";
import {typeExtraSwitch} from "../parts/attribute-extra-components";
import {Info} from "../../utils/utils";
import {withoutSystemAttributes} from "../../../model/instances";
import {IMessages} from "../../../i18n/messages";
import {ErrorPO} from "../../utils/validation-errors";
import {ValidationError} from "../../../validators/validators";


// Add some UI / Client only properties to the Attribute type
export class UIAttribute extends Attribute {
    expanded ?:boolean;
    uid?: number; // Used as React unique "key", since attrirbute name is not yet filled
}

export enum AddButtonPosition {
    TOP,
    BOTTOM}

interface AttributeListProps {
    messages:IMessages;
    onUpdateAttributes : (attributes: UIAttribute[]) => void;
    schema : StructType;
    addButtonPosition: AddButtonPosition
}

export class AttributeList extends React.Component<AttributeListProps> {

    state : { attributes : UIAttribute[]};

    // Counter used for filling UID of new attributes
    uid = 0;

    // Remove system attributes
    static cleanSchema(props:AttributeListProps) : AttributeListProps {
        let {schema, ...otherProps} = props;
        return {schema:withoutSystemAttributes(schema), ...otherProps}
    }

    constructor(props: AttributeListProps) {

        super(AttributeList.cleanSchema(props));

        // Clone the input object : not modify it until we validate
        this.state =  {attributes: deepClone(this.props.schema.attributes)};
    }

    forceRedraw() {
        this.setState({attributes:this.state.attributes});
        this.props.onUpdateAttributes(this.state.attributes);
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
        if (this.props.addButtonPosition == AddButtonPosition.TOP) {
            this.state.attributes.unshift(attr);
        } else {
            this.state.attributes.push(attr);
        }
        this.forceRedraw();
    }

    updateType(index:number, type:Type<any>) {
        let attr = this.state.attributes[index];
        attr.type = type;
        this.forceRedraw()
    }

    remove(index:number) {
        let _ = this.props.messages;
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
        let _ = this.props.messages;

        let TYPE_OPTIONS = [
            {value: Types.BOOLEAN, text:_.type_boolean, icon: "check square outline"},
            {value: Types.NUMBER, text:_.type_number, icon:"number"},
            {value: Types.ENUM, text:_.type_enum, icon:"list"},
            {value: Types.DATETIME, text:_.type_datetime, icon:"clock outline"},
            {value: Types.TEXT, text:_.type_text, icon:"font"}];


        // Get type text from options for a given tag
        function typeDescr(tag:string) {
            return TYPE_OPTIONS.filter(option => option.value == tag)[0]
        }

        // Loop on schema attributes
        let attributes = this.state.attributes.map((attr, index) => {

            // Extra parameters for this specific type
            let typeExtra = typeExtraSwitch({
                messages:this.props.messages,
                type: attr.type,
                errorPrefix: `${index}.type.`, // FIXME  : put it in ErrorContext
                onUpdate: (type) => this.updateType(index, type)});


            // Extra parameters, common to all attributes
            let attributeExtra = <Grid columns={3}>

                {attr.type.tag == Types.TEXT &&
                <Grid.Column >
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
                </Grid.Column>}

                <Grid.Column >
                    <Checkbox
                        checked={attr.isMandatory}
                        label={_.is_mandatory}
                        disabled={attr.isName}
                        onChange={(e, val) => {
                            attr.isMandatory = val.checked;
                            this.forceRedraw();
                        }} />
                </Grid.Column>

                {typeExtra}

            </Grid>

            return <Segment key={attr.saved ? attr.name : attr.uid} >


                <Grid divided="vertically" >
                    <Grid.Row className="hoverable" >
                        <Grid.Column  width={8}>

                            <Header >
                                <EditableText
                                    {...this.props}
                                    forceEdit={!attr.saved}
                                    value={attr.label}
                                    placeholder={ _.attribute_name}
                                    onChange={ (value) => this.changeLabel(index, value)} />
                                {attr.isName &&
                                    <Label
                                        basic size={"tiny"} style={{float:"right"}} >{_.name}</Label>}

                                        <ErrorPO attributeKey={`${index}.name`} />
                                        <ErrorPO attributeKey={`${index}.label`} />

                            </Header>
                        </Grid.Column>
                        <Grid.Column width={5}>
                            <Button
                                basic
                                compact className="shy"
                                onClick={() => this.toggleAttr(index)}>
                                {_.attribute_details }
                                <Icon name={attr.expanded ? "chevron up" : "chevron down"} />
                            </Button>
                            <Label size={"large"}>
                                <Icon name={typeDescr(attr.type.tag).icon as any} />
                                {typeDescr(attr.type.tag).text}
                            </Label>
                        </Grid.Column>
                        <Grid.Column width={2}    className="super-shy" >
                            <Button.Group size="mini" compact >
                                <Button size="mini" compact icon="angle up"
                                        onClick={() => this.moveUp(index)}/>
                                <Button size="mini" compact icon="angle down"
                                        onClick={() => this.moveDown(index)}/>
                            </Button.Group>
                        </Grid.Column>
                        <Grid.Column width={1}>
                            <Button
                                icon="trash"
                                className="super-shy"
                                size="small"
                                onClick={() => this.remove(index) } />
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

        let addAttributeButton = <Button.Group color='green' float="left">
            <Dropdown
                text={_.add_attribute}
                button color="blue"
                labeled icon="add" className="icon"
                options={TYPE_OPTIONS}
                style={{marginTop:"1em", marginBottom:"1em"}}
                onChange={(e, val) => this.addAttribute(val.value as string)}
            />
        </Button.Group>;

        return <>
            {this.props.addButtonPosition == AddButtonPosition.TOP && addAttributeButton}

            <SegmentGroup>
                {attributes}
            </SegmentGroup>

            {this.props.addButtonPosition == AddButtonPosition.BOTTOM && addAttributeButton}
        </>
    }


}


