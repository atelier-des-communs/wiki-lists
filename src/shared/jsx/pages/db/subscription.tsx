import * as React from "react";
import {DbPathParams, DbProps, PageProps, UpdateActionsImpl} from "../../common-props";
import {AsyncDataComponent} from "../../async/async-data-component";
import {Subscription} from "../../../model/notifications";
import {createUpdateSubscriptionAction} from "../../../redux";
import {AlertForm} from "../../components/alert-form";
import {extractFilters} from "../../../views/filters";
import {Container} from "semantic-ui-react";

interface SubscriptionAsyncData {
    subscription : Subscription
}


export class SubscriptionComponent extends AsyncDataComponent<PageProps<DbPathParams> & DbProps, SubscriptionAsyncData>{

    constructor(props:PageProps<DbPathParams> & DbProps) {
        super(props);
    }

    fetchData(nextProps: PageProps<{}>, nextState: {}): Promise<SubscriptionAsyncData> | SubscriptionAsyncData {
        let email = (this.props.match.params as any).email;
        let state = this.props.store.getState();
        if (!(email in state.subscriptions)) {
            return this.props.dataFetcher
                .getSubscription(email)
                .then((subscription) => {
                    this.props.store.dispatch(createUpdateSubscriptionAction(subscription));
                    return {subscription}
                });
        } else {
            return {subscription:state.subscriptions[email]};
        }
    }

    renderLoaded() {

        let subscription = this.asyncData.subscription;
        let filters = extractFilters(this.props.db.schema, subscription.filters);
        console.error(filters)
        /// XXX useless
        let updateActions = new UpdateActionsImpl(this.props);
        let childProps = {...this.props, ...updateActions};

        return <Container>
                <AlertForm {...childProps} filters={filters as any} email={subscription.email}  />
            </Container>
    }
}

