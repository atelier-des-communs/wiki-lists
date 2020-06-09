import * as React from "react";
import {Email, EmailTemplates} from "./definitions";
import {config} from "../../config";

export let emailsEn : EmailTemplates =
    {
        loginEmail(link: string) {
            return {
                subject: `Connection link for ${config.SITE_NAME}`,
                html: <p>
                    Hello,<br/>
                    <br/>
                    Please follow this link to connect to {config.SITE_NAME} :<br/>
                    <a href={link}>{link}</a>
                </p>
            }
        },

        newSubscription(email:string,commune:string, manageLink:string) : Email {

            // XXX Vigibati
            return {
                subject : `[Vigibati.fr] Vous êtes abonné aux alertes de ${commune}`,
                html : <>
                    <h4>Bienvenue sur VigiBati,</h4>
                    <p>
                        Vous venez de vous abonner aux alertes de <a href="https://vigibati.fr">Vigibati.fr</a> pour la commune : ${commune} <br/>

                        Vous pouvez
                        <a href={manageLink} >changer vos paramètres de notification</a> ou vous
                        <a href={manageLink + "&unsubscribe"} >désabonner complètement</a>
                    </p>
                </>
            }
        }
    }