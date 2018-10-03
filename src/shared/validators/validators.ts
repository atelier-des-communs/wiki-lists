// Single error message of validation
import {empty, itToArray} from "../utils";
import {DefaultMessages} from "../i18n/messages";


// Function returning either null (no error) or error message
export type Validator = (value:any) => string | null;


export class ValidationError {
    attribute: string;
    message:string;
    shown:boolean = false;
    constructor(field:string, message:string) {
        this.attribute = field;
        this.message = message;
    }
}

export class ValidationException extends Error {
    validationErrors : ValidationError[];

    constructor(errors : ValidationError[]) {
        super(JSON.stringify(errors));
        this.validationErrors = errors;
    }
}

export function raiseExceptionIfErrors(errorsIt: IterableIterator<ValidationError>) {
    let errors = itToArray(errorsIt);
    if (errors.length > 0) {
        throw new ValidationException(errors);
    }
}


// Compose validators
export function AndCompose(val1 : Validator, val2: Validator) : Validator {
    return (value:any) => {
        let msg1 = val1(value);
        if (msg1 != null) return msg1;
        return val2(value);
    }
}

// Common validators
export function notEmptyValidator(_:DefaultMessages) : Validator {
    return (value:string) => {
        if (empty(value)) return _.should_not_be_empty;
        return null;
    }
}

export function regExpValidator(reg: RegExp, msg:string) : Validator {
    return (value:string) => {
        if (reg.test(value)) return null;
        return msg;
    }
}






