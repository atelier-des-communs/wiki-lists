import * as React from "react";
import {ValidationErrors} from "../../validators/validators";

/** Generic dialog calling POST method upon validation with potential validation error as results */
export abstract class ValidatingForm<T> extends React.Component<T> {

    state : {
        loading: boolean,
        errors:ValidationErrors};

    constructor(props:T) {
        super(props);
    }

    // Should raise a ValidatingException upon problems
    abstract async validateInternal() : Promise<void>;

    async validate() {

        // "Loading" icon
        this.setState({loading:true});

        try {

            await this.validateInternal();

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