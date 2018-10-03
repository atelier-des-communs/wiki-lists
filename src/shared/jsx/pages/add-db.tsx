import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Container, Form, Input, Divider, Button, Step, Segment, Label, Icon} from "semantic-ui-react";
import {RouteComponentProps} from "react-router";
import ReactQuill from 'react-quill';
import {BASE_DB_PATH, RECORDS_PATH} from "../../api";
import {deepClone, Map, mapMap, slug} from "../../utils";
import {Attribute, StructType, TextType, Type} from "../../model/types";
import {DefaultMessages} from "../../i18n/messages";
import {AddButtonPosition, AttributeList} from "../dialogs/parts/attribute-list";
import {Wizard, WizardStep} from "../components/wizard";
import {checkAvailability, createDb} from "../../rest/client";
import {AndCompose, notEmptyValidator, regExpValidator, ValidationError, Validator} from "../../validators/validators";
import {DbDefinition} from "../../../server/db/db";
import {MainLayout} from "./layout/main-layout";

const SLUG_REG = new RegExp(/^[1-9a-zA-Z\-_]*$/)

enum SlugState{
    LOADING, OK, ERROR
}


type AddDbPageProps = GlobalContextProps & RouteComponentProps<{}>;
export class AddDbPageInternal extends React.Component<AddDbPageProps> {

    state : {
        name:string,
        slug: string,
        description : string,
        schema: StructType,
        errors : {
            nameDesc : ValidationError[],
            attributes : ValidationError[]
        },
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
            errors: {attributes: [], nameDesc: []},
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

    // Transform error to red label if it exists
    // Mark the error as shown
    // TODO factorize with commonDialog
    showError(allErrors: ValidationError[], key: string) : JSX.Element {
        let errors = allErrors
            .filter(error => error.attribute == key)
            .map(error => {
                error.shown = true;
                return error.message
            });
        let error = errors.join(",\n");

        if (error) {
            return <Label color="red" pointing="left" >{error}</Label>;
        }
        return null;
    }

    selectTemplate(idx:number) {
        this.setState({
            selectedTemplate:idx,
            schema:deepClone(this.templates[idx].schema)});
    }


    // Build a validator function, checking this.state.[key], filling this.state.errors[key] and returning a status
    buildValidator(allErrors: ValidationError[], validators: Map<Validator> , ) : Promise<boolean> {
        return new Promise((resolve, reject) => {
            let isOk = true;
            allErrors.splice(0, allErrors.length);
            mapMap(validators, (key, validator) => {
                let message = validator(this.state[key]);
                if (message != null) {
                    isOk = false;
                    allErrors.push(new ValidationError(key, message));
                }
            });
            this.setState({errors:this.state.errors});
            resolve(isOk);
        });
    }

    render() {

        let props = this.props;
        let _ = this.props.messages;
        let base_url = location.protocol + '//' + location.host + BASE_DB_PATH;

        // Function returning an async validator
        // FIXME : quite ugly
        let nameDescValidator = () =>
            this.buildValidator(this.state.errors.nameDesc, {
            "slug": AndCompose(
                notEmptyValidator(_),
                regExpValidator(SLUG_REG, _.slug_regexp_no_match)),
            "name":notEmptyValidator(_)

                // Add async check of db availability
            }).then((res) => {
                if (!res) return false;
                return checkAvailability(this.state.slug).then((available : boolean) => {
                    if (!available) {
                        this.state.errors.nameDesc.push(new ValidationError("slug", _.db_not_available));
                    }
                    this.setState({errors: this.state.errors});
                    return available;
                });
            });

        let addDbValidator = () => {
            let dbDef : DbDefinition = {
                schema : this.state.schema,
                name : this.state.slug,
                label : this.state.name,
                description : this.state.description
            };
            return createDb(dbDef).then((res) => {
                if (!res) return false;
                this.props.history.push(RECORDS_PATH.replace(":db_name", this.state.slug));
                return true;
            });
        };

        return <MainLayout messages={props.messages} lang={props.lang} >

        <Container>
            <h1>{_.creating_db}</h1>

            <Form>
                <Wizard {...this.props} >

                    <WizardStep title={_.create_db_name_description}
                                validator={nameDescValidator} >
                        <Form.Field inline required>
                            <label>{_.db_name}</label>
                            <Input
                                placeholder={_.db_name}
                                value={this.state.name}
                                onChange={(event, data) => this.updateName(data.value)}/>

                            { this.showError(this.state.errors.nameDesc,"name") }

                        </Form.Field>

                        <Form.Field inline required>
                            <label>{_.db_url}</label>
                            <Input
                                label={base_url}
                                value={this.state.slug}
                                onChange={(event, data) => this.updateSlug(data.value)} >
                            </Input>

                            { this.showError(this.state.errors.nameDesc, "slug") }


                        </Form.Field>

                        <Form.Field>
                            <label>{_.db_description}</label>
                            <ReactQuill
                                value={this.state.description}
                                onChange={(content, delta, source, editor) => this.setState({description: editor.getHTML()})} />
                        </Form.Field>
                    </WizardStep>

                    <WizardStep title={_.fields} validator={addDbValidator}>
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
                            errorLabel={() => null}
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
function templates(_:DefaultMessages) : SchemaTemplate[] {

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