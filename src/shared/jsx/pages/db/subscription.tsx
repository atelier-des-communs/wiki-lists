import * as React from "react";
import {DbPathParams, DbProps, PageProps, UpdateActionsImpl} from "../../common-props";
import {AsyncDataComponent} from "../../async/async-data-component";
import {Subscription} from "../../../model/notifications";
import {createUpdateSubscriptionAction} from "../../../redux";
import {SubscriptionForm} from "../../components/subscription-form";
import {extractFilters, serializeFilters} from "../../../views/filters";
import {Container, Message, Button} from "semantic-ui-react";
import {debug, getDbName, mapValues, parseParams} from "../../../utils";
import {IMessages} from "../../../i18n/messages";
import * as Immutable from "seamless-immutable";
import {addSubscription} from "../../../../client/rest/client-db";
import {toast} from 'react-semantic-toasts';

interface SubscriptionAsyncData {
    subscription : Subscription
}

export class SubscriptionComponent extends AsyncDataComponent<PageProps<DbPathParams> & DbProps, SubscriptionAsyncData>{

    secret:string;
    unsubscribe:boolean

    constructor(props:PageProps<DbPathParams> & DbProps) {
        super(props);
        let queryParams = parseParams(this.props.location.search);
        this.secret = queryParams.secret;
        this.unsubscribe = (queryParams.unsubscribe !== undefined)
    }

    fetchData(nextProps: PageProps<{}>, nextState: {}): Promise<SubscriptionAsyncData> | SubscriptionAsyncData {

        let email = (this.props.match.params as any).email;
        let state = this.props.store.getState();
        if (!(email in state.subscriptions)) {
            return this.props.dataFetcher
                .getSubscription(email, this.secret)
                .then((subscription) => {

                    this.props.store.dispatch(createUpdateSubscriptionAction(subscription));

                    // Do async unsuscribe
                    if (this.unsubscribe) {

                        subscription.disabled = true;

                        return this.props.dataFetcher.updateSubscription(
                                getDbName(this.props),
                                subscription,
                                this.secret)
                            .then(() => {
                                this.props.store.dispatch(createUpdateSubscriptionAction(subscription));
                                return {subscription}});
                    } else {
                        return {subscription}
                    }
                });
        } else {
            return {subscription:state.subscriptions[email]};
        }
    }

    subscribeAgain() {


        let subscription = this.asyncData.subscription;
        if (Immutable.isImmutable(subscription)) {
            subscription = (subscription as any).asMutable();
        }
        subscription.disabled = false;
        this.props.dataFetcher.updateSubscription(
            getDbName(this.props),
            subscription,
            this.secret)
            .then(() => {
                this.props.store.dispatch(createUpdateSubscriptionAction(subscription));
                this.asyncData.subscription = subscription
                this.setState({})});
    }

    async updateSubscription() {

        let form = this.refs.form as SubscriptionForm;

        await form.validate();

        let subscription : Subscription=  {
            email: form.state.email,
            filters: serializeFilters(mapValues(form.state.filters))};

        await this.props.dataFetcher.updateSubscription(
            getDbName(this.props),
            subscription,
            this.secret);

        toast({
            type: "info",
            title: 'Alerte modifiée',
            time: 2000,
            description : "Votre abonnement aux alertes a été modifié"
        });
    }

    renderLoaded() {

        let _ : IMessages = this.props.messages;


        let subscription = this.asyncData.subscription;
        let filters = extractFilters(this.props.db.schema, subscription.filters);
        console.error(filters)

        /// XXX useless
        let updateActions = new UpdateActionsImpl(this.props);

        let childProps = {...this.props, ...updateActions};

        return    <Container>
            {
                this.asyncData.subscription.disabled ?
                    <>
                        <Message info>
                            <Message.Header>{_.you_are_unuscribed}</Message.Header>
                            <p>
                                {_.you_are_unuscribed_long}
                            </p>
                        </Message>
                        <Button positive content={_.subscribe_again} onClick={() => this.subscribeAgain() }/>
                    </>
                    :
                    <>
                        <h1>Configuration des notifications</h1>
                        <SubscriptionForm
                            ref="form"
                            {...childProps}
                            filters={filters as any} email={subscription.email} update={true} />
                        <Button positive content="Mettre à jour" onClick={() => this.updateSubscription() }/>
                     </>
            }
            </Container>
    }
}

