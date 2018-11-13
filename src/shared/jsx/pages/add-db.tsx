import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Button, Container, Form, Input, Label, TextArea} from "semantic-ui-react";
import {RouteComponentProps} from "react-router";
import {BASE_DB_PATH, RECORDS_PATH} from "../../api";
import {deepClone, Map, mapMap, slug} from "../../utils";
import {Attribute, StructType, TextType, Type} from "../../model/types";
import {IMessages} from "../../i18n/messages";
import {AddButtonPosition, AttributeList} from "../dialogs/parts/attribute-list";
import {Wizard, WizardStep} from "../components/wizard";
import {checkAvailability, createDb, toPromiseWithErrors} from "../../rest/client";
import {AndCompose, notEmptyValidator, regExpValidator, ValidationError, Validator} from "../../validators/validators";
import {DbDefinition} from "../../../server/db/db";
import {MainLayout} from "./layout/main-layout";
import {ErrorPO} from "../utils/validation-errors";

const SLUG_REG = new RegExp(/^[1-9a-zA-Z\-_]*$/)

type AddDbPageProps = GlobalContextProps & RouteComponentProps<{}>;
export class AddDbPageInternal extends React.Component<AddDbPageProps> {

    state : {
        name:string,
        slug: string,
        description : string,
        schema: StructType,
        selectedTemplate: number,
        [index:string]:any};

    templates : SchemaTemplate[];

    constructor(props: AddDbPageProps) {
        super(props);
        this.templates = templates(this.props.messages);
        this.state = {
            description:"",
            slug:"",
            name:"",
            schema : deepClone(this.templates[0].schema),
            selectedTemplate: 0};
    }


    // Update both name and slug
    updateName(name:string) {
        this.setState({name});

        // Only update slug if it was not edited
        if (this.state.slug == slug(this.state.name)) {
            this.updateSlug(slug(name));
        }
    }

    updateSlug(slug:string) {
        this.setState({slug});
    }


    selectTemplate(idx:number) {
        this.setState({
            selectedTemplate:idx,
            schema:deepClone(this.templates[idx].schema)});
    }

    goToNewDb() {
        this.props.history.push(RECORDS_PATH.replace(":db_name", this.state.slug));
    }

    render() {

        let props = this.props;
        let _ = this.props.messages;
        let base_url = location.protocol + '//' + location.host + BASE_DB_PATH;

        let nameValidator = () => {return notEmptyValidator(_)(this.state.name)};

        let slugValidators = [() => AndCompose(
            notEmptyValidator(_),
            regExpValidator(SLUG_REG, _.slug_regexp_no_match))(this.state.slug),
            () => checkAvailability(this.state.slug).then(res => res ? null : _.db_not_available)];

        let addDbValidator = () => {
            let dbDef : DbDefinition = {
                schema : this.state.schema,
                name : this.state.slug,
                label : this.state.name,
                description : this.state.description
            };
            return toPromiseWithErrors(createDb(dbDef));
        };

        return <MainLayout {...props} >

        <Container>
            <h1>{_.creating_db}</h1>

            <Form>
                <Wizard {...this.props} onValidate={() => this.goToNewDb()}>

                    <WizardStep title={_.create_db_name_description} >

                        <Form.Field inline required>
                            <label>{_.db_name}</label>
                            <Input
                                placeholder={_.db_name}
                                value={this.state.name}
                                onChange={(event, data) => this.updateName(data.value)}/>

                            <ErrorPO attributeKey="name" validators={nameValidator} />

                        </Form.Field>

                        <Form.Field inline required>
                            <label>{_.db_url}</label>
                            <Input
                                label={base_url}
                                value={this.state.slug}
                                onChange={(event, data) => this.updateSlug(data.value)} >
                            </Input>

                            <ErrorPO attributeKey="slug" validators={slugValidators}/>


                        </Form.Field>

                        <Form.Field>
                            <label>{_.db_description}</label>
                            <TextArea
                                rows={3}
                                value={this.state.description}
                                onChange={(event, data) => this.setState({description: data.value})} />
                        </Form.Field>

                    </WizardStep>

                    <WizardStep title={_.fields} validator={() => addDbValidator()}>
                        <div>
                            {_.schema_templates} :
                        </div>
                        {this.templates.map((template, index) =>
                            <Button
                                key={index}
                                content={template.label}
                                basic
                                active={index == this.state.selectedTemplate}
                                onClick = {() => {this.selectTemplate(index)}}
                            /> )}

                        <AttributeList
                            addButtonPosition={AddButtonPosition.BOTTOM}
                            schema={this.state.schema}
                            onUpdateAttributes={(attributes: Attribute[]) => {
                                this.state.schema.attributes = attributes;
                                this.setState({schema : this.state.schema});
                            }}
                            messages={this.props.messages} />

                    </WizardStep>
                </Wizard>
            </Form>
        </Container>
        </MainLayout>
    }
};

interface SchemaTemplate {
    label : string;
    schema: StructType;
}

function newAttr(name:string, label:string, type: Type<any>, isName:boolean = false) {
    let res = new Attribute();
    res.name = name;
    res.label = label;
    res.type = type;
    res.saved = true;
    if (isName) {
        res.isName = true;
        res.isMandatory = true;
    }
    return res;
}

// Generate list of templates for schemas
function templates(_:IMessages) : SchemaTemplate[] {

    let nameAttr = newAttr("name", _.name, new TextType(), true);
    let descrAttr = newAttr("description", _.description, new TextType(true));

    let defaultSchema = new StructType([nameAttr, descrAttr]);

    return [
        {
            schema:defaultSchema,
            label:_.default_schema},
        {
            schema:defaultSchema,
            label:_.default_schema}]
}

export const AddDbPage = withGlobalContext(AddDbPageInternal);