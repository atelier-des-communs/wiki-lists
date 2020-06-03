import * as React from "react";
import {CloseableDialog, ValidatingDialog} from "./common-dialog";
import {Button, Header, Icon, Modal} from "semantic-ui-react";
import {ErrorsContext} from "../utils/validation-errors";
import {DbPageProps} from "../pages/db/db-page-switch";
import {EnumFilter, extractFilters, NumberFilter, serializeFilters, TextFilter} from "../../views/filters";
import {
    debug,
    filterSingle,
    getDbName,
    Map,
    mapValues,
    parseParams
} from "../../utils";
import {Attribute} from "../../model/types";

import {addAlert} from "../../../client/rest/client-db";
import { toast } from 'react-semantic-toasts';

import {AlertForm, AREA_ATTR, CITY_ATTR, TYPE_ATTR} from "../components/alert-form";
import {ValidatingForm} from "../components/validating-form";



export class AddAlertDialog extends ValidatingDialog<DbPageProps & CloseableDialog> {

    state : {loading:boolean, errors:{}};

    constructor(props: DbPageProps) {
        super(props);

        this.state =  {
            loading: false,
            errors:{}};
    }

    async validateInternal() {

        let form = this.refs.form as AlertForm;

        await form.validate();

        await addAlert(
            getDbName(this.props),
            form.state.email,
            form.state.captcha,
            serializeFilters(mapValues(form.state.filters)));

        debug("Closing ?");

        toast({
            type: "info",
            title: 'Alerte enregistrée',
            time: 4000,
            description : "Vous êtes abonné aux alertes"
        });
    }

    render()  {

        let _ = this.props.messages;
        let filters = extractFilters(this.props.db.schema, parseParams(this.props.location.search));

        return <Modal
                open={true}
                closeIcon={true}
                onClose={()=> this.props.close && this.props.close() } >

                <Header icon='bell' content="S'abonner aux alertes"/>

                <Modal.Content>
                    <AlertForm ref="form" {...this.props} filters={filters} email={""} />
                </Modal.Content>

                <Modal.Actions>
                    <Button loading={this.state.loading} color='green' onClick={() => this.validate()}>
                        <Icon name='envelope'/> S'abonner
                    </Button>
                </Modal.Actions>

            </Modal>;

    }


}