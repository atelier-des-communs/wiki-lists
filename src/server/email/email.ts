import * as nodemailer from "nodemailer";

import {Email} from "./templates/definitions";
import {renderToString} from "react-dom/server";
import * as HtmlToText from "html-to-text";
import {config} from "../../server/config";
import * as mailgun from "nodemailer-mailgun-transport";
import {Map} from "../../shared/utils";


let emailConfig = config.MAILGUN_API ?
    mailgun({auth: {
        api_key: config.MAILGUN_API,
        domain: config.MAILGUN_DOMAIN
    }})

    : {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure : config.SMTP_SECURE,
    auth : {
        user: config.SMTP_LOGIN,
        pass: config.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: config.SMTP_REJECT_UNAUTHORIZED
    }
}

console.log("Email config", emailConfig);

let transport = nodemailer.createTransport(emailConfig);

export function sendMail(email:string, content:Email) {

    let html = renderToString(content.html);
    let text = HtmlToText.fromString(html);

    let data : mailgun.MailOptions = {
        from: config.MAIL_FROM,
        to : email,
        subject: content.subject,
        html,
        text,
    }

    if (content.headers) {
        data = {
            ...data,
            headers:content.headers};
    }
    console.log(`Sending email to ${email} : ${content.subject}`);

    return transport.sendMail(data);
}

