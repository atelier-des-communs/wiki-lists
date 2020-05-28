import * as React from "react";
import {EmailTemplates} from "./definitions";
import Config from "../../config";

export let emailsFr : EmailTemplates =
{
    loginEmail(link: string) {
        return {
            subject: `Lien de connection à ${Config.SITE_NAME}`,
            html: <p>
                Bonjour,<br/>
                <br/>
                Pour vous connecter à {Config.SITE_NAME}, merci de suivre ce lien :<br/>
                <a href={link}>{link}</a>
            </p>
        }
    }
}