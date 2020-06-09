import * as React from "react";
import {DbPathParams, DbProps, PageProps, UpdateActionsImpl} from "../../common-props";
import {AsyncDataComponent} from "../../async/async-data-component";
import {Subscription} from "../../../model/notifications";
import {createUpdateSubscriptionAction} from "../../../redux";
import {SubscriptionForm} from "../../components/subscription-form";
import {extractFilters} from "../../../views/filters";
import {Container, Message, Button} from "semantic-ui-react";
import {getDbName, parseParams} from "../../../utils";
import {IMessages} from "../../../i18n/messages";
import * as Immutable from "seamless-immutable";

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
                    <SubscriptionForm {...childProps} filters={filters as any} email={subscription.email} update={true} />
            }
            </Container>
    }
}

