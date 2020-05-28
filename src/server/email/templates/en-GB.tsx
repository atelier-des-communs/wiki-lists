import * as React from "react";
import {EmailTemplates} from "./definitions";
import Config from "../../config";

export let emailsEn : EmailTemplates =
    {
        loginEmail(link: string) {
            return {
                subject: `Connection link for ${Config.SITE_NAME}`,
                html: <p>
                    Hello,<br/>
                    <br/>
                    Please follow this link to connect to {Config.SITE_NAME} :<br/>
                    <a href={link}>{link}</a>
                </p>
            }
        }
    }