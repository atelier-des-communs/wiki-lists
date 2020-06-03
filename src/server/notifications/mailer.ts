import * as nodemailer from "nodemailer";
import * as mailgun from "nodemailer-mailgun-transport";
import {config} from "../config";
import * as htmltotext from "html-to-text";

var mailer = nodemailer.createTransport(mailgun({auth: {
        api_key: config.MAILGUN_API,
        domain: config.MAIL_DOMAIN
    },
}));


/** Sends an email asynchronously, adding a "text" rendering from HTML one */
export function sendMail(to:string, subject:string, html:string) {
    let text = htmltotext.fromString(html, {wordwrap:130});
    return mailer.sendMail({
        from: config.MAIL_FROM,
        to, html, text, subject})
}