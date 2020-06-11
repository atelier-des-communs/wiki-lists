// Should be first, import .env file
import 'jsdom-global/register';
import 'dotenv/config';


import {send_emails} from "./commands/send_emails";
import {clear_caches} from "./commands/clear_caches";

// Read from .env
let command = process.argv[process.argv.length -1]

let commandF : () => Promise<any> = null;

switch (command) {

    case "send_emails" :
        commandF = send_emails
        break;

    case "clear_caches" :
        commandF = clear_caches
        break;

    default:
        throw Error("Unknown command " + command)
}

commandF()
    .then(() => process.exit())
    .catch((e) => {
        console.error("Failed ...", e);
        process.exit(-1)
    });



