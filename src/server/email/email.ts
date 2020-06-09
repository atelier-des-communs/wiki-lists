import * as nodemailer from "nodemailer";
import Config from "../config";
import {Email} from "./templates/definitions";
import {renderToString} from "react-dom/server";
import * as HtmlToText from "html-to-text";


let emailConfig = {
    host: Config.SMTP_HOST,
    port: Config.SMTP_PORT,
    secure : Config.SMTP_SECURE,
    auth : {
        user: Config.SMTP_LOGIN,
        pass: Config.SMTP_PASS,
    },
    tls: { 
    	 rejectUnauthorized: Config.SMTP_REJECT_UNAUTHORIZED
    }
};

console.log("Email config", emailConfig);

let transport = nodemailer.createTransport(emailConfig);

export function sendMail(email:string, content:Email) {

    let html = renderToString(content.html);
    let text = HtmlToText.fromString(html);

    console.log("sending mail", email, html)

    return transport.sendMail({
        from: Config.SMTP_FROM,
        to : email,
        subject: content.subject,
        html,
        text,
    })
}

