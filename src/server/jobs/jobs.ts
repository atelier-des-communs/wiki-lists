import * as kue from "kue";


var queue = kue.createQueue();

export function sendJob(jobName:string, data:any) {
    console.debug("Job sent to queue", jobName, data);
    queue.create(jobName, data).
    removeOnComplete( true ).
    save((err:any) => {
        if (err) {
            console.error(`Error while saving job ${jobName}`, data, err);
        }
    });
}


export function registerJobHandler(jobName: string, process : (data:any)=> void) {
    queue.process(jobName,  (job:kue.Job, done:kue.DoneCallback) => {
        try {
            console.debug("Processing job with data", jobName, job.data);
            process(job.data);
            console.debug("Done job with data", jobName, job.data);
            done();
        } catch (e) {
            done(e);
        }
    })
}

