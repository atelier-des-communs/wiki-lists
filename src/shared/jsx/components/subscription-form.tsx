import * as React from "react";
import {EnumFilter, Filter, NumberFilter, TextFilter} from "../../views/filters";
import {ValidationErrors, ValidationException} from "../../validators/validators";
import {DbPageProps} from "../pages/db/db-page-switch";
import {CloseableDialog} from "../dialogs/common-dialog";
import {isEqual} from "lodash";
import {ErrorPlaceholder, ErrorsContext, RemainingErrorsPlaceholder} from "../utils/validation-errors";
import {EnumFilterComponent, NumberFilterComponent, TextFilterComponent} from "../type-handlers/filters";
import {Form, Header, Input, Label, Message} from "semantic-ui-react";
import ReCAPTCHA from "react-google-recaptcha";
import {empty, emptyMap, filterSingle, Map} from "../../utils";
import {Attribute} from "../../model/types";
import {ValidatingForm} from "./validating-form";

export const CITY_ATTR = "commune";
export const TYPE_ATTR = "type";
export const AREA_ATTR = "superficie_locaux";

interface SubscriptionFormProps {
    filters : Map<Filter>,
    email:string
    update?:boolean
}


interface IState  {
    errors:  ValidationErrors,
    filters : {
            [CITY_ATTR] : TextFilter,
            [TYPE_ATTR] : EnumFilter,
            [AREA_ATTR] : NumberFilter},
    email:string,
    captcha:string
    count:number;
    loading:boolean;
}

type Props = SubscriptionFormProps & DbPageProps


export class SubscriptionForm extends ValidatingForm<Props> {

    state : IState;
    attrs : Map<Attribute> = {};

    constructor(props: Props) {
        super(props);

        this.attrs = {};

        for (let key of [CITY_ATTR, TYPE_ATTR, AREA_ATTR]) {
            this.attrs[key] = filterSingle(this.props.db.schema.attributes, (attr) => attr.name == key);
        }

        this.state = {
            captcha: null,
            count: null,
            errors: {},
            loading: false,
            email : props.email,
            filters: this.selectFilters(props.filters),
        };

        this.updateCount(this.state);
    }

    selectFilters(filters : Map<Filter>) {
        return {
            [CITY_ATTR] : filters[CITY_ATTR] as TextFilter || new TextFilter(this.attrs[CITY_ATTR]),
            [TYPE_ATTR] : filters[TYPE_ATTR] as EnumFilter || new EnumFilter(this.attrs[TYPE_ATTR]),
            [AREA_ATTR] : filters[AREA_ATTR] as NumberFilter || new NumberFilter(this.attrs[AREA_ATTR])};
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

    componentWillUpdate(nextProps: Readonly<DbPageProps & CloseableDialog>, nextState: Readonly<IState>, nextContext: any): void {
        if (!isEqual(this.state.filters, nextState.filters)) {
            this.updateCount(nextState);
        }
    }

    async validateInternal() : Promise<void> {

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

        if (!this.props.update && empty(this.state.captcha)) {
            errors["captcha"] = "Veuillez cocher le captcha";
        }

        if (!emptyMap(errors)) {
            throw new ValidationException(errors);
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

                    <Form>

                        <Form.Group >

                            <Form.Field >
                                <Header
                                    title={_.mandatory_attribute}
                                >
                                    Email
                                    <Label circular color="red" size="tiny" empty />
                                </Header>

                                {
                                    this.props.update ? null :
                                    <p>Votre email ne sera ni diffusé ni utilisé autrement que pour ces alertes.</p>
                                }

                                <Input disabled={this.props.update} size="small" type="email" value={this.state.email} onChange={(e, data) => {
                                    this.setState({email: data.value});
                                }} />
                                <ErrorPlaceholder attributeKey="email" />

                            </Form.Field>

                            {this.props.update ? null : <>
                                <Form.Field >
                                    <Header
                                        title={_.mandatory_attribute}>
                                        Captcha
                                        <Label circular color="red" size="tiny" empty />
                                    </Header>


                                        <ReCAPTCHA
                                            sitekey={this.props.config.captcha_key}
                                            onChange={(token) => this.setState({captcha: token})}
                                        />
                                        <ErrorPlaceholder attributeKey="captcha" />
                                </Form.Field>
                            </>}
                        </Form.Group>


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



                        <RemainingErrorsPlaceholder messages={_}/>

                    </Form>

                    { this.state.count != null &&
                    <Message warning >
                        {messageNums}
                        <br/>
                        Affinez les filtres pour en recevoir plus ou moins.
                    </Message>}

        </ErrorsContext.Provider>;

    }

}