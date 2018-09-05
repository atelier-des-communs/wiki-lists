// Single error message of validation
import {itToArray} from "../utils";

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


