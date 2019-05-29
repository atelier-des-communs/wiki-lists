import * as React from "react";
import {ValidationErrors} from "../../validators/validators";
import {Label} from "semantic-ui-react";

export interface CloseableDialog {
    close?: () => void;
}

/** Generic dialog calling POST method upon validation with potential validation error as results */
export abstract class ValidatingDialog<T extends CloseableDialog> extends React.Component<T> {

    state : {
        loading: boolean,
        errors:ValidationErrors};

    constructor(props:T) {
        super(props);
    }

    abstract async validateInternal() : Promise<void>;

    async validate() {

        // "Loading" icon
        this.setState({loading:true});

        // Async POST of schema
        try {

            await this.validateInternal();
            this.props.close();

        } catch (e) {

            // Functional error, containing validationErrors to be shown to user
            if (e.validationErrors) {
                this.setState({errors: e.validationErrors});
            } else {
                // Rethrow
                throw e;
            }
        } finally {
            this.setState({loading:false});
        }
    }

}