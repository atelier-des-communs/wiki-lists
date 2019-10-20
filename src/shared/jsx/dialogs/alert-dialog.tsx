import * as React from "react";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {ValidationErrors, ValidationException} from "../../validators/validators";
import {nonSystemAttributes} from "../../model/instances";
import {Button, Form, Grid, Header, Icon, Label, Message, Modal, Input} from "semantic-ui-react";
import {attrLabel, typeIsWide} from "../utils/utils";
import {ValueHandler} from "../type-handlers/editors";
import {ErrorPlaceholder, ErrorsContext, RemainingErrorsPlaceholder} from "../utils/validation-errors";
import {DbPageProps} from "../pages/db/db-page-switch";
import {EnumFilter, extractFilters, Filter, TextFilter} from "../../views/filters";
import {empty, emptyMap, filterSingle, Map, parseParams} from "../../utils";
import {EnumFilterComponent, TextFilterComponent} from "../type-handlers/filters";
import {Attribute} from "../../model/types";


const CITY_ATTR = "commune";
const TYPE_ATTR = "type";

export class AddAlertDialog extends ValidatingDialog<DbPageProps & CloseableDialog> {

    state : {
        loading: boolean,
        cityFilter : TextFilter,
        typeFilter : EnumFilter,
        email:string,
        count:number;
        errors:ValidationErrors};

    cityAttr : Attribute;
    typeAttr : Attribute;


    constructor(props: DbPageProps) {
        super(props);

        let filters = extractFilters(props.db.schema, parseParams(props.location.search));
        this.cityAttr = filterSingle(this.props.db.schema.attributes, (attr) => attr.name == CITY_ATTR);
        this.typeAttr = filterSingle(this.props.db.schema.attributes, (attr) => attr.name == TYPE_ATTR);

        this.state =  {
            loading: false,
            email:"",
            count:null,
            cityFilter : filters[CITY_ATTR] as TextFilter || new TextFilter(this.cityAttr),
            typeFilter : filters[TYPE_ATTR] as EnumFilter || new EnumFilter(this.typeAttr),
            errors:{}};

        this.updateCount();
    }

    async validateInternal() {

        let EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

        let errors : Map<string> = {};

        if (!this.state.cityFilter || !this.state.cityFilter.exact) {
            errors[CITY_ATTR] = "Veuillez choisir une commune"
        }

        if (!this.state.email) {
            errors["email"] = "Email manquant"
        } else if (! EMAIL_RE.test(this.state.email.toLowerCase())) {
            errors["email"] = "Email invalide"
        }

        if (!emptyMap(errors)) {
            throw new ValidationException(errors);
        }
    }

    async updateCount() {
        if (this.state.cityFilter.exact) {
            let count = await this.props.dataFetcher.countRecords(this.props.db.name, {
                [CITY_ATTR]: this.state.cityFilter,
                [TYPE_ATTR]: this.state.typeFilter,
            });
            this.setState({count})
        }
    }

    render()  {

        let _ = this.props.messages;

        let tensPerMonth = this.state.count && Math.floor(this.state.count / (24 * 10));

        return <ErrorsContext.Provider value={{errors:this.state.errors, displayedErrors:[]}}>

            <Modal
                open={true}
                closeIcon={true}
                onClose={()=> this.props.close && this.props.close() } >

                <Header icon='bell' content="S'abonner aux alertes"/>

                <Modal.Content>
                    <Form>
                        <Form.Field  width={7} >
                            <Header
                                size="small"
                                title={_.mandatory_attribute}>

                                Commune

                                <Label circular color="red" size="tiny" empty />
                            </Header>

                            <TextFilterComponent
                                {...this.props}
                                attr={this.cityAttr}
                                updateFilter={(filter) => {
                                    this.setState({cityFilter:filter});
                                    this.updateCount();
                                }}
                                filter={this.state.cityFilter} />

                            <ErrorPlaceholder attributeKey={CITY_ATTR} />

                        </Form.Field>

                        <Form.Field  width={7} >

                            <Header size="small">
                                Type de construction
                            </Header>

                            <EnumFilterComponent
                                {...this.props}
                                attr={this.typeAttr}
                                updateFilter={(filter) => {
                                    this.setState({typeFilter:filter});
                                    this.updateCount();
                                }}
                                filter={this.state.typeFilter}
                                nbCols={3} />

                        </Form.Field>

                        <Form.Field width={7} >
                            <Header
                                size="small"
                                title={_.mandatory_attribute}>

                                Email

                                <Label circular color="red" size="tiny" empty />
                            </Header>

                            <Input type="email" onChange={(e, data) => {
                                this.setState({email: data.value});
                            }} />

                            <ErrorPlaceholder attributeKey="email" />

                            <Message content={"Votre email ne sera ni diffusé ni utilisé autrement que pour ces alertes. "} />

                        </Form.Field>

                    </Form>

                    { this.state.count != null &&
                    <Message warning >
                        Vous recevrez un email mensuel avec {tensPerMonth * 10} à {(tensPerMonth + 1) * 10} projets de permis.<br/>
                        Affinez les filtres si vous souhaitez en recevoir moins.
                    </Message>}

                </Modal.Content>

                <Modal.Actions>

                    <RemainingErrorsPlaceholder messages={_}/>

                    <Button loading={this.state.loading} color='green' onClick={() => this.validate()}>
                        <Icon name='envelope'/> S'abonner
                    </Button>
                </Modal.Actions>

            </Modal>
        </ErrorsContext.Provider>;

    }


}