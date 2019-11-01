import * as React from "react";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {ValidationErrors, ValidationException} from "../../validators/validators";
import {Button, Form, Grid, Header, Icon, Label, Message, Modal, Input} from "semantic-ui-react";
import {ErrorPlaceholder, ErrorsContext, RemainingErrorsPlaceholder} from "../utils/validation-errors";
import {DbPageProps} from "../pages/db/db-page-switch";
import {EnumFilter, extractFilters, NumberFilter, serializeFilters, TextFilter} from "../../views/filters";
import {
    buildMap, empty,
    emptyMap,
    filterSingle,
    getDbName,
    Map,
    mapKeyVals,
    mapMap,
    mapValues,
    parseParams
} from "../../utils";
import {EnumFilterComponent, NumberFilterComponent, TextFilterComponent} from "../type-handlers/filters";
import {Attribute} from "../../model/types";
import {isEqual} from "lodash";
import {addAlert} from "../../../client/rest/client-db";
import { toast } from 'react-semantic-toasts';
import ReCAPTCHA from "react-google-recaptcha";


const CITY_ATTR = "commune";
const TYPE_ATTR = "type";
const AREA_ATTR = "superficie_locaux";

type IState = {
    loading: boolean,
        filters :
            {
                [CITY_ATTR] : TextFilter,
                [TYPE_ATTR] : EnumFilter,
                [AREA_ATTR] : NumberFilter}
        email:string,
        captcha:string,
        count:number;
    errors:ValidationErrors}

export class AddAlertDialog extends ValidatingDialog<DbPageProps & CloseableDialog> {

    state : IState;

    attrs : Map<Attribute> = {};

    constructor(props: DbPageProps) {
        super(props);

        let filters = extractFilters(props.db.schema, parseParams(props.location.search));

        // Extract attributes
        for (let key of [CITY_ATTR, TYPE_ATTR, AREA_ATTR]) {
            this.attrs[key] = filterSingle(this.props.db.schema.attributes, (attr) => attr.name == key);
        }

        this.state =  {
            loading: false,
            email:"",
            captcha: null,
            count:null,
            filters :{
                [CITY_ATTR] : filters[CITY_ATTR] as TextFilter || new TextFilter(this.attrs[CITY_ATTR]),
                [TYPE_ATTR] : filters[TYPE_ATTR] as EnumFilter || new EnumFilter(this.attrs[TYPE_ATTR]),
                [AREA_ATTR] : filters[AREA_ATTR] as NumberFilter || new NumberFilter(this.attrs[AREA_ATTR]),
            },
            errors:{}};

        this.updateCount(this.state);
    }

    async validateInternal() {

        let EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

        let errors : Map<string> = {};

        if (!this.state.filters[CITY_ATTR] || !this.state.filters[CITY_ATTR].exact) {
            errors[CITY_ATTR] = "Veuillez choisir une commune"
        }

        if (!this.state.email) {
            errors["email"] = "Email manquant"
        } else if (! EMAIL_RE.test(this.state.email.toLowerCase())) {
            errors["email"] = "Email invalide"
        }

        if (empty(this.state.captcha)) {
            errors["captcha"] = "Veuillez cocher le captcha";
        }

        if (!emptyMap(errors)) {
            throw new ValidationException(errors);
        }

        await addAlert(
            getDbName(this.props),
            this.state.email,
            this.state.captcha,
            serializeFilters(mapValues(this.state.filters)));

        toast({
            type: "info",
            title: 'Alerte enregistrée',
            time: 4000,
            description : "Vous êtes abonné aux alertes"
        });
    }

    componentWillUpdate(nextProps: Readonly<DbPageProps & CloseableDialog>, nextState: Readonly<IState>, nextContext: any): void {
        if (!isEqual(this.state.filters, nextState.filters)) {
            this.updateCount(nextState);
        }
    }

    async updateCount(nextState: Readonly<IState>) {
        if (nextState.filters[CITY_ATTR].exact) {
            let count = await this.props.dataFetcher
                .countRecords(
                    this.props.db.name,
                    nextState.filters);
            this.setState({count})
        }
    }

    render()  {

        let _ = this.props.messages;

        let numPerMonth = this.state.count && (this.state.count / 24);

        let messageNums = null;
        if (numPerMonth < 1/12) {
            messageNums = `Vous recevrez moins de 1 projet par an, par email.`;
        } else if (numPerMonth < 1) {
            messageNums = `Vous recevrez environ un projet tous les ${Math.ceil(1 / numPerMonth)} mois.`;
        } else {
            messageNums = `Vous recevrez environ ${Math.ceil(numPerMonth)} projet(s) par mois dans un email mensuel.`;
        }

        return <ErrorsContext.Provider value={{errors:this.state.errors, displayedErrors:[]}}>

            <Modal
                open={true}
                closeIcon={true}
                onClose={()=> this.props.close && this.props.close() } >

                <Header icon='bell' content="S'abonner aux alertes"/>

                <Modal.Content>
                    <Form>
                        <Form.Group >
                            <Form.Field  >
                                <Header
                                    size="small"
                                    title={_.mandatory_attribute}>

                                    Commune

                                    <Label circular color="red" size="tiny" empty />
                                </Header>

                                <TextFilterComponent
                                    {...this.props}
                                    attr={this.attrs[CITY_ATTR]}
                                    updateFilter={(filter) => {this.setState(
                                        {filters: {
                                            ...this.state.filters,
                                                [CITY_ATTR]:filter}});}}
                                    filter={this.state.filters[CITY_ATTR]} />

                                <ErrorPlaceholder attributeKey={CITY_ATTR} />

                            </Form.Field>

                            <Form.Field  >
                                <Header
                                    size="small"
                                    title={_.mandatory_attribute}>

                                    Superficie des locaux (optionnel)

                                </Header>

                                <NumberFilterComponent
                                    {...this.props}
                                    hidemax={true}
                                    attr={this.attrs[AREA_ATTR]}
                                    updateFilter={(filter) => {this.setState(
                                        {filters: {
                                                ...this.state.filters,
                                                [AREA_ATTR]:filter}});}}
                                    filter={this.state.filters[AREA_ATTR]} />

                            </Form.Field>

                        </Form.Group>

                        <Form.Field >

                            <Header size="small">
                                Type de construction
                            </Header>

                            <EnumFilterComponent
                                {...this.props}
                                attr={this.attrs[TYPE_ATTR]}
                                updateFilter={(filter) => {this.setState(
                                    {filters: {
                                            ...this.state.filters,
                                            [TYPE_ATTR]:filter}});}}
                                filter={this.state.filters[TYPE_ATTR]}
                                nbCols={4} />

                        </Form.Field>

                        <Form.Group >

                            <Form.Field >
                                <Header
                                    title={_.mandatory_attribute}
                                >
                                    Email
                                    <Label circular color="red" size="tiny" empty />
                                </Header>

                                <p>Votre email ne sera ni diffusé ni utilisé autrement que pour ces alertes.</p>

                                <Input size="small" type="email" onChange={(e, data) => {
                                        this.setState({email: data.value});
                                    }} />
                                    <ErrorPlaceholder attributeKey="email" />

                            </Form.Field>
                            <Form.Field >
                                <Header
                                    title={_.mandatory_attribute}>
                                    Captcha
                                    <Label circular color="red" size="tiny" empty />
                                </Header>

                                <ReCAPTCHA
                                    sitekey={this.props.config.captcha_key}
                                    onChange={(token) => this.setState({captcha:token})}
                                />
                                <ErrorPlaceholder attributeKey="captcha" />

                            </Form.Field>
                        </Form.Group>

                    </Form>

                    { this.state.count != null &&
                    <Message warning >
                        {messageNums}
                        <br/>
                        Affinez les filtres pour en recevoir plus ou moins.
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