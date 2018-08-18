import * as Express from "express";
import {ValidationException} from "../shared/validators/validators";
import {VALIDATION_STATUS_CODE} from "../shared/rest/api";

// Handy function returing 200 ans the payload result of the promise of returning 500 on error
export function returnPromise(res: Express.Response, promise: Promise<{}>) {
    promise.then(
        content => {
            res.status(200).send(content)
        }).
    catch(
        error => {
            console.log("Error occured", error);
            if (error.validationErrors) {
                // Send list of errors back to client, with custom error codes
                res.status(VALIDATION_STATUS_CODE).send(error.validationErrors);
            } else {
                res.status(500).send(error);
            }
        });
}