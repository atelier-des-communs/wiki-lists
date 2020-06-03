import {sendMail} from "../mailer";


export function sendNewAlertEmail(email:string,commune:string) {
    
    let title = `[Vigibati.fr] Vous êtes abonné aux alertes de ${commune}`;

    let html = `
    Bienvenue sur VigiBati,<br/> 
    <br/>
    Vous venez de vous abonner aux alertes de <a href="https://vigibati.fr">Vigibati.fr</a> pour la commune : ${commune} <br/>
    <br/>
    Vous pouvez <a href="">changer vos paramètres de notification</a> ou vous <a href="">désabonner complètement</a>
    `;

    sendMail(email, title , html);
}


