import * as React from "react";
import {withGlobalContext} from "../context/global-context";
import {Button, Container, Form, Input, TextArea} from "semantic-ui-react";
import {BASE_DB_PATH, RECORDS_PATH} from "../../api";
import {deepClone, slug} from "../../utils";
import {Attribute, StructType, TextType} from "../../model/types";
import {IMessages} from "../../i18n/messages";
import {AddButtonPosition, AttributeList} from "../dialogs/parts/attribute-list";
import {Wizard, WizardStep} from "../components/wizard";
import {checkAvailability, createDb} from "../../../client/rest/client-db";
import {
    notEmptyValidator,
    regExpValidator,
    validationError,
    Validator,
    ValueValidator
} from "../../validators/validators";
import {DbDefinition} from "../../model/db-def";
import {MainLayout} from "./layout/main-layout";
import {ErrorPlaceholder} from "../utils/validation-errors";
import {PageProps} from "../common-props";
import {toPromiseWithErrors} from "../../../client/rest/common";
import {AccessRightsKind} from "../../access";

const SLUG_REG = new RegExp(/^[1-9a-zA-Z\-_]*$/);

export class AddDbPageInternal extends React.Component<PageProps<{}>> {

    state : {
        name:string,
        slug: string,
        description : string,
        schema: StructType,
        accessRights: AccessRightsKind,
        selectedTemplate: number,
        [index:string]:any};

    templates : SchemaTemplate[];

    constructor(props: PageProps<{}>) {
        super(props);
        this.templates = templates(this.props.messages);
        this.state = {
            description:"",
            slug:"",
            name:"",
            accessRights: AccessRightsKind.WIKI,
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

        // Async check of availability of slug
        let slugAvailabilityValidator : ValueValidator = (value:string) => checkAvailability(value)
            .then(res => res ? null : validationError("slug", _.db_not_available));

        // Makes async REST call for Db creation
        let addDbValidator : Validator = () => {
            let dbDef = new  DbDefinition({
                schema : this.state.schema,
                name : this.state.slug,
                label : this.state.name,
                accessRights : this.state.accessRights,
                description : this.state.description});

            return toPromiseWithErrors(createDb(dbDef));
        };

        return <MainLayout {...props} >

        <Container>
            <h1>{_.creating_db}</h1>

            <Form>
                <Wizard {...this.props} onFinish={() => this.goToNewDb()}>

                    <WizardStep title={_.create_db_name_description} >

                        <Form.Field inline required>
                            <label>{_.db_name}</label>
                            <Input
                                placeholder={_.db_name}
                                value={this.state.name}
                                onChange={(event, data) => this.updateName(data.value)}/>

                            <ErrorPlaceholder
                                attributeKey="name"
                                validators={notEmptyValidator("name", _)}
                                value={()=> this.state.name} />

                        </Form.Field>

                        <Form.Field inline required>
                            <label>{_.db_url}</label>
                            <Input
                                label={base_url}
                                value={this.state.slug}
                                onChange={(event, data) => this.updateSlug(data.value)} >
                            </Input>

                            <ErrorPlaceholder
                                value={() => this.state.slug}
                                attributeKey="slug"
                                validators={[
                                    notEmptyValidator("slug", _),
                                    regExpValidator("slug", SLUG_REG, _.slug_regexp_no_match),
                                    slugAvailabilityValidator]}/>


                        </Form.Field>

                        <Form.Field>
                            <label>{_.db_description}</label>
                            <TextArea
                                rows={3}
                                value={this.state.description}
                                onChange={(event, data) => this.setState({description: data.value})} />
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
                            schema={this.state.schema}
                            onUpdateAttributes={(attributes: Attribute[]) => {
                                this.state.schema.attributes = attributes;
                                this.setState({schema : this.state.schema});
                            }}
                            messages={this.props.messages} />

                    </WizardStep>

                    <WizardStep title={_.db_access} >

                        <Form.Field>
                            <label>{_.db_access}</label>
                            <Form.Dropdown
                                selection
                                options={[
                                    {key: AccessRightsKind.WIKI, text: _.accessType[AccessRightsKind.WIKI], value:AccessRightsKind.WIKI},
                                    {key: AccessRightsKind.COLLABORATIVE, text: _.accessType[AccessRightsKind.COLLABORATIVE], value:AccessRightsKind.COLLABORATIVE},
                                    {key: AccessRightsKind.READ_ONLY, text: _.accessType[AccessRightsKind.READ_ONLY], value:AccessRightsKind.READ_ONLY},
                                ]}
                                value={this.state.accessRights}
                                onChange={(event, data) => this.setState({accessRights: data.value})} />
                        </Form.Field>

                    </WizardStep>



                </Wizard>
            </Form>
        </Container>
        </MainLayout>
    }
}

interface SchemaTemplate {
    label : string;
    schema: StructType;
}



// Generate list of templates for schemas
function templates(_:IMessages) : SchemaTemplate[] {

    let nameAttr = new Attribute({
        name: "name",
        label:_.name,
        type:new TextType(),
        isName:true,
        isMandatory:true});

    let descrAttr = new Attribute({
        name: "description",
        label: _.description,
        type:new TextType(true)});

    let defaultSchema = new StructType([nameAttr, descrAttr]);

    return [
        {
            schema:defaultSchema,
            label:_.default_schema},
        {
            schema:defaultSchema,
            label:_.default_schema}]
}

export default withGlobalContext(AddDbPageInternal);