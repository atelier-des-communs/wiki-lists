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
    },

    inviteEmail(link: string, dbName:string) {
        return {
            subject: `Vous avez été invité à participer à "${dbName}"`,
            html: <p>
                Bonjour,<br/>
                <br/>
                Vous avez été invité par un administrateur à participer à la base de données "{dbName}"<br/>
                Merci de cliquer sur <a href={link}>ce lien</a> pour vous connecter.
            </p>
        }
    }
}