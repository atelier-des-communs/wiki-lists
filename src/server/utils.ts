import * as Express from "express";

// Handy function returing 200 ans the payload result of the promise of returning 500 on error
export function returnPromise(res: Express.Response, promise: Promise<{}>) {
    promise.then(
        content => {
            res.status(200).send(content)
        }).
    catch(
        reason => {
            console.log("Error occured", reason);
            res.status(500).send(reason.message);
        });
}