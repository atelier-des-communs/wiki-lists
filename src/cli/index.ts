// Should be first, import .env file
import 'jsdom-global/register';
import 'dotenv/config';


import {send_emails} from "./commands/send_emails";
import {config} from "../server/config";

// Read from .env
let command = process.argv[process.argv.length -1]

switch (command) {
    case "send_emails" :
        send_emails(config.SINGLE_BASE)
            .then(() => process.exit())
            .catch(
                () => {
                    console.error("Failed ...");
                    process.exit(-1);
            });
        break;
    default:
        throw Error("Unknown command ")
}

