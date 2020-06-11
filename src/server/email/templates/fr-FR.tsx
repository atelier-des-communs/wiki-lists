import * as React from "react";
import {Email, EmailTemplates, LIST_UNSUBSCRIBE, SimpleRecord} from "./definitions";
import {config} from "../../config";
import {DbDefinition} from "../../../shared/model/db-def";


let NUM_RECORDS=5;

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

    newSubscription(commune:string, manageLink:string) : Email {

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
    },

    notification(commune:string, records: SimpleRecord[], manageURl: string, allURL: string): Email {

        let n = records.length;

        // sort by surface and show first only
        let selection = records.sort((a, b) => b.surface - a.surface).slice(0, NUM_RECORDS)

        let unsubscribe_link = manageURl + "&unsubscribe";
        return {
            subject : `[${config.SITE_NAME}] ${records.length} nouveaux permis de contruire à ${commune}`,
            headers: {[LIST_UNSUBSCRIBE] : `<${unsubscribe_link}>`},
            html : <>
                <h4>Nouveaux permis de construire</h4>
                <p>
                    Nous avons trouvé {n} nouveaux permis de construire correspondant à vos critères d'alerte, sur la commune de {commune}:
                <ul>
                    {selection.map(record => <li>
                        <a href={record.link}>{record.name}</a> <br/>
                        <b>Type</b> : {record.type} <br/>
                        {record.surface? <><b>Surface</b>  : {record.surface} m2<br/></> : null}
                        <b>Addresse</b> : {record.addresse}<br/>
                    </li>)}
                    {selection.length < records.length ? <li>...</li> : null}
                </ul>
                    Cliquez <a href={allURL}>sur ce lien</a> pour une liste de tous les permis correspondant à cette recherche.
                </p>
                <p style={{fontSize:"small"}}>
                    Pour changer les paramètres de notification, <a href={manageURl}>suivez ce lien</a>.<br/>
                    Pour vous désabonner complètement de ces alertes, <a href={unsubscribe_link}>suivez ce lien</a>.
                </p>
            </>
        }
    }
}