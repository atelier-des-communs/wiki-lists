// Single error message of validation
import {empty, itToArray, Map, oneToArray} from "../utils";
import {IMessages} from "../i18n/messages";

// Type alias to Map of error(s) per field
export type ValidationErrors = Map<string | string[]>

// Create singleton map of single validation error
export function validationError(key:string, val:string) : ValidationErrors {
    let res : ValidationErrors = {};
    res[key] = val;
    return res;
}

// Validators are either synchronous or asynchronous
export type SynchronousValidator = () => ValidationErrors;
export type AsyncronousValidator = () => Promise<ValidationErrors>;
export type Validator = SynchronousValidator | AsyncronousValidator;

// Value validator
export type ValueValidator = (value:string) => ValidationErrors | Promise<ValidationErrors>




// Merge dicts of errors, happending errors in arrays for a same key
export function mergeErrors(it : IterableIterator<ValidationErrors>) : ValidationErrors {
    let res : ValidationErrors = {};
    for (let errors of it) {
        for (let key of Object.keys(errors)) {

            let val = errors[key];

            if (key in res) {
                res[key] = oneToArray(res[key]).concat(oneToArray(val));;
            } else {
                res[key] = val;
            }
        }
    }
    return res;
}

export class ValidationException extends Error {
    validationErrors : ValidationErrors;

    constructor(errors : ValidationErrors) {
        super(JSON.stringify(errors));
        this.validationErrors = errors;
    }
}

/** Raise ValidationException in case of errors */
export function dieIfErrors(errorsIt: IterableIterator<ValidationErrors>) {
    let errors = mergeErrors(errorsIt);
    if (errors) {
        throw new ValidationException(errors);
    }
}

// Tranform synchronous function to Promise
// also takes Promise => returns it as is
function resolveValidator(validator : Validator) : Promise<ValidationErrors> {
    // Not Promise ? => make one
    let res = validator();
    if (res == null || !(res as any).then) {
        return new Promise((resolve, reject) => {resolve(res)});
    } else {
        return res as Promise<ValidationErrors>;
    }
}

/** Fires validators (sync or async ones) and returns a promise*/
export function fireAllValidators(validators : Validator[]) : Promise<ValidationErrors> {
    let promises : Promise<ValidationErrors>[] = validators.map(resolveValidator);

    // Wait for all and merge the result ValidationErrors
    return Promise.all(promises).then(errorsList => mergeErrors(errorsList))
}

// Common validators
export function notEmptyValidator(key:string, _:IMessages) : ValueValidator {
    return (value:string) => {
        if (empty(value)) return validationError(key, _.should_not_be_empty);
        return {};
    }
}

export function regExpValidator(key:string, reg: RegExp, msg:string) : ValueValidator {
    return (value:string) => {
        if (reg.test(value)) return {};
        return validationError(key,msg);
    }
}






