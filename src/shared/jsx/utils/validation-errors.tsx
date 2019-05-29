
/**
 *  This file provides helpers for dealing with validation errors.
 *  replaceErrors() will transform the VDOM by replacing ValidationError with error contents.
 */
import * as React from "react";
import {ValidationErrors, Validator, ValueValidator} from "../../validators/validators";
import {applyRec} from "./utils";
import {Label, Message} from "semantic-ui-react";
import {IMessages} from "../../i18n/messages";
import {empty, flatMap, mapMap, OneOrMany, oneToArray} from "../../utils";


interface ErrorContextProps {
    errors : ValidationErrors;
    displayedErrors: string[]; // List of keys already displayed
}

// Context holding current validation errors, passed to nested children
export const ErrorsContext : React.Context<ErrorContextProps> = React.createContext({errors:{}, displayedErrors:[]});


// Display single error or list of errors, only if present
export const ErrorLabel : React.SFC<{errors:string | string[]}> = (props) => {
    let errors  = props.errors;

    if (!errors) {
        return null;
    }

    // Single error ?
    if (typeof errors === "string") {
        errors = [errors];
    }

    errors = errors as string[];

    if (errors.length > 0) {
        return <Label color="red">
            {errors.map( error => <><span>{error}</span><br/></>)}
        </Label>;
    } else {
        return null;
    }
};

/** Placeholder for errors that will be replaced by actual errors for the corresponding key by #replaceErrors */
interface ErrorPlaceholderProps  {
    value ?: () => string,
    attributeKey:string,
    validators?: OneOrMany<ValueValidator> ;
}

/** Take errors results from context for this attribute, display it */
export const ErrorPlaceholder : React.SFC<ErrorPlaceholderProps> = (props) =>
     <ErrorsContext.Consumer>
        {({errors, displayedErrors}) => {
            let attrErrors = errors[props.attributeKey];
            displayedErrors.push(props.attributeKey)
            return <ErrorLabel errors={oneToArray(attrErrors)} />
        }}
    </ErrorsContext.Consumer>;


/** Placeholder for general errors, not catched by any ErrorPlaceHolder.
 * It will be replaced by remaining errors by #replaceErrors */
interface ErrorsProps {
    messages: IMessages
}
export const RemainingErrorsPlaceholder : React.SFC<ErrorsProps> = (props) =>
    <ErrorsContext.Consumer>
        {({errors, displayedErrors}) => {

            let _ = props.messages;

            let remainingMessages = flatMap(

                // Filter remaining keys not already displayed
                Object
                    .keys(errors)
                    .filter(key => displayedErrors.indexOf(key) != -1),

                // Flaten to JSX spans
                key => {
                    let messages = oneToArray(errors[key]);
                    return messages.map(message => {
                        if (!empty(key)) {
                            console.warn("Error had an attribute name but was not displayed", key);
                            message = key + ": " + message;
                        }
                        return <>
                            <span>{message}</span><br/>
                        </>
                    })
                });

            if (remainingMessages) {
                return  <Message
                    visible
                    error
                    header={_.form_error}
                    content={remainingMessages} />
            } else {
                return null;
            }}}
    </ErrorsContext.Consumer>;



/**
 * Gathers all ErrorPlaceholder ValueValidators, and bind them to their value
 */
export function getErrorPlaceholderValidators(element:React.ReactElement<{children:any}>) : Validator[] {

    let res : Validator[] = [];

    applyRec(element, (child, index) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        // Replace single error placeholder
        if (child.type == ErrorPlaceholder) {
            let props =(child.props as ErrorPlaceholderProps);
            let valueValidators = oneToArray(props.validators)
            let valueF = props.value;

            // Append validators
            res.push.apply(valueValidators.map(valueValidator => {
                return () => {
                    valueValidator(valueF());
                }
            }));
        }

        return child;
    });

    return res;
}


