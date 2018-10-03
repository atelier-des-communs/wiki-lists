import * as React from "react";
import {ValidationError} from "../../validators/validators";
import {Label} from "semantic-ui-react";

export interface CloseableDialog {
    close?: () => void;
}

/** Generic dialog calling POST method upon validation with potential validation error as results */
export abstract class ValidatingDialog<T extends CloseableDialog> extends React.Component<T> {

    state : {
        loading: boolean,
        errors:ValidationError[]};

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

    /** Return label with potential validation errors.
     * Mark the error that have been shown in the UI as "shown" */
    errorLabel(key: string) : JSX.Element {
        let errors = this.state.errors
            .filter(error => error.attribute == key)
            .map(error => {
                error.shown = true;
                return error.message
            });
        let error = errors.join(",\n");

        if (error) {
            return <Label color="red">{error}</Label>;
        } else {
            return <span style={{display:"none"}}>Placeholder for errors {key} </span>;
        }
    }

    /** List of remaining error messages */
    remainingErrors() {
        let errors = this.state.errors
            .filter(error => !error.shown)
            .map(error => `${error.attribute} : ${error.message}`)
        return errors.join(",\n");
    }

}