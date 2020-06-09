import Axios, {AxiosPromise} from "axios";
import {toAnnotatedJson, toTypedObjects} from "../../shared/serializer";
import {VALIDATION_ERROR_STATUS_CODE} from "../../shared/api";
import {ValidationErrors, ValidationException} from "../../shared/validators/validators";
import {HttpError} from "../../shared/errors";

const axios = Axios.create();

// Catch specific status code and unwrap it as a validation exception
export function unwrapAxiosResponse<T>(promise : AxiosPromise<T>) : Promise<T> {
    return promise.then((response: any) => {

        // Parse type annotation and add prototypes
        return toTypedObjects(response.data);

    }).catch(error => {
        console.error("Server error happened", error);

        // In case of validation error, wrap the errors into proper ValidationException
        if (error.response) {

            if (error.response.status == VALIDATION_ERROR_STATUS_CODE) {
                console.info("Transformed to validation exception", error.response.data);
                throw new ValidationException(error.response.data);
            } else {

                // Generic HTTP error
                throw new HttpError(error.response.status, error.response.data);
            }

        } else {
            // Unkown error (connection maybe ?)
            alert("A network error happened : " + error);
            throw error;
        }
    });
}


/** Add type information before sending */
export async function post<T>(url:string, data:any=null) : Promise<T> {
    let json = toAnnotatedJson(data);
    return unwrapAxiosResponse<T>(axios.post(url, json));
}

export async function del<T>(url:string, data:any=null) : Promise<T> {
    let json = toAnnotatedJson(data);
    return unwrapAxiosResponse<T>(axios.delete(url, json));
}

export async function get<T>(url:string) : Promise<T> {
    return unwrapAxiosResponse<T>(axios.get(url));
}


// For simple action transform the promise into a Promise of either null (success) or list of validation errors
// FIXME : this sucks : too much complicated ...
export function toPromiseWithErrors(promise : Promise<{}>) : Promise<ValidationErrors> {
    return promise
        .then(res => null)
        .catch(e => {
            if (e.validationErrors) {
                return e.validationErrors;
            } else {
                // Rethrow
                throw e;
            }});
}


