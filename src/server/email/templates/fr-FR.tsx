import * as React from "react";
import {Email, EmailTemplates, LIST_UNSUBSCRIBE} from "./definitions";
import {config} from "../../config";




export let emailsFr : EmailTemplates =
{
    loginEmail(link: string) {
        return {
            subject: `Lien de connection à ${config.SITE_NAME}`,
            html: <p>
                Bonjour,<br/>
                <br/>
                Pour vous connecter à {config.SITE_NAME}, merci de suivre ce lien :<br/>
                <a href={link}>{link}</a>
            </p>
        }
    },

    newSubscription(email:string,commune:string, manageLink:string) : Email {

        let unsubscribe_link = manageLink + "&unsubscribe";

        // XXX Vigibati
        return {
            subject : `[Vigibati.fr] Vous êtes abonné aux alertes de ${commune}`,
            headers: {[LIST_UNSUBSCRIBE] : `<${unsubscribe_link}>`},
            html : <>
                <h4>Bienvenue sur VigiBati</h4>
                <p>
                    Vous venez de vous abonner aux alertes de <a href="https://vigibati.fr">Vigibati.fr</a> pour {commune}<br/>
                    <br/>
                    Vous pouvez
                    <ul>
                        <li>Changer vos paramètres de notification en cliquant <a href={manageLink} >sur ce lien</a></li>
                        <li>Vous désabonner, en cliquant <a href={unsubscribe_link} >sur ce lien</a></li>
                    </ul>
                </p>
            </>
        }
    }
}