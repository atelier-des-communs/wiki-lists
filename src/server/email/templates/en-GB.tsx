import * as React from "react";
import {Email, EmailTemplates, LIST_UNSUBSCRIBE, SimpleRecord} from "./definitions";
import {config} from "../../config";
import {DbDefinition} from "../../../shared/model/db-def";

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

        newSubscription(commune:string, manageLink:string) : Email {

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
        },


        notification(commune:string, records: SimpleRecord[], manageURl: string, allURL: string): Email {

            let n = records.length;
            let unsubscribe_link = manageURl + "&unsubscribe";
            return {
                subject : `[${config.SITE_NAME}] ${records.length} nouveaux permis de contruire à ${commune}`,
                headers: {[LIST_UNSUBSCRIBE] : `<${unsubscribe_link}>`},
                html : <>
                    <h4>Nouveaux permis de construire</h4>
                    <p>
                        Nous avons trouvé ${n} nouveaux permis de construire correspondant à vos critères d'alerte :
                        <ul>
                            {records.map(record => <li>
                                <a href={record.link}>{record.name}</a> <br/>
                                <b>Type</b> : {record.type} <br/>
                                <b>Surface</b>  : {record.surface}
                                <b>Addresse</b> : {record.addresse}
                            </li>)}
                        </ul>
                        Cliquez <a href={allURL}>sur ce lien</a> pour une liste de tous les permis corredpondant à cette recherche.
                    </p>
                    <p style={{fontSize:"small"}}>
                        Pour changer les paramètres de notification, <a href={manageURl}>suivez ce lien</a>.<br/>
                        Pour vous désabonner complètement de ces alertes, <a href={unsubscribe_link}>suivez ce lien</a>.
                    </p>
                </>
            }
        }
    }