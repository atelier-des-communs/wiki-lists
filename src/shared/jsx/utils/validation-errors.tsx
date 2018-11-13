
/**
 *  This file provides helpers for dealing with validation errors.
 *  replaceErrors() will transform the VDOM by replacing ValidationError with error contents.
 */
import * as React from "react";
import {ValidationError} from "../../validators/validators";
import {recursiveChildrenMap} from "./utils";
import {Label, Message} from "semantic-ui-react";
import {IMessages} from "../../i18n/messages";
import {empty, resolveFuncOrPromise} from "../../utils";


type SynchronousValidator = () => string | null;
type AsyncronousValidator = () => Promise<string | null>;
type Validator = SynchronousValidator | AsyncronousValidator;

interface ValidationErrorProps {
    attributeKey:string,
    validators?: Validator[] | Validator;
}

/** Placeholder for errors that will be replaced by actual errors for the corresponding key by #replaceErrors */
export const ErrorPO : React.SFC<ValidationErrorProps> = (props) => {
    console.warn(`placeholder for validation of ${props.attributeKey}. Should have been replaced by using replaceErrors()`);
    return null;
};

/** Placeholder general error, not catched by any ValidationError.
 * It will be replaced by remaining errors by #replaceErrors */
export const RemainingErrorsPO : React.SFC<{}> = (props) => {
    console.warn(`placeholder for default validation error. Should have been replaced by using replaceErrors()`);
    return null;
};


export function replaceErrorsPO(element:React.ReactElement<{children:any}>, errors: ValidationError[], _:IMessages) : React.ReactElement<{}> {

    let keys: string[] = [];
    errors = errors || [];

    let children = recursiveChildrenMap(element, (child, index) => {

        if (!React.isValidElement(child)) {
            return child;
        }

        // Replace single error placeholder
        if (child.type == ErrorPO) {
            let key =(child.props as ValidationErrorProps).attributeKey;
            keys.push(key);

            let errorsMsg = errors
                .filter(error => error.attribute == key)
                .map(error => <><span>{error.message}</span><br/></>);
            if (errorsMsg.length > 0) {
                return <Label color="red">{errorsMsg}</Label>;
            } else {
                return null;
            }
        }

        // Replace remaining placeholder => returns a function for deferring evaluation at the end
        if (child.type == RemainingErrorsPO) {

            let Res : React.SFC = () => {

                let remainingMessages = errors
                    .filter(error => !(error.attribute in keys))
                    .map(error => {
                        let message = error.message;
                        if (!empty(error.attribute)) {
                            console.warn("Error had an attribute name but was not displayed", error.attribute);
                            message = error.attribute + ":" + message;
                        }

                        return <>
                            <span>{message}</span><br/>
                        </>
                    });

                if (remainingMessages.length > 0) {
                    return  <Message
                        visible
                        error
                        header={_.form_error}
                        content={remainingMessages} />
                } else {
                    return null;
                }
            };

            return <Res/>;
        }

        return child;

    });
    return React.cloneElement(element, {children});
}


/**
 * Gathers all ErrorPO validators and compose them into a single promise that :
 * - Evaluate all validators
 * - Fills "errors" with ValidationErrors
 * - Returns a single boolean value of all the validation
 */
export function fireValidators(element:React.ReactElement<{children:any}>, errors: ValidationError[]) : Promise<boolean> {

    // Gather validators
    let promises: Promise<boolean>[] = [];

    recursiveChildrenMap(element, (child, index) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        // Replace single error placeholder
        if (child.type == ErrorPO) {
            let props =(child.props as ValidationErrorProps);
            let newValidators : Validator[] = [].concat(props.validators || []);

            // Map them to boolean Promise
            let newPromises = newValidators.map(validator => {
                return resolveFuncOrPromise(validator).then(error => {
                    if (error) {
                        errors.push(new ValidationError(props.attributeKey, error));
                        return false;
                    } else {
                        return true;
                    }
                })
            });
            promises.push(...newPromises);
        }
        return child;
    });

    return Promise.all(promises).then(values => {
        return values.reduce((a, b) => a && b, true);
    });
}


