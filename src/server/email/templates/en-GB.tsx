import * as React from "react";
import {EmailTemplates} from "./definitions";
import Config from "../../config";

export let emailsEn : EmailTemplates =
    {
        loginEmail(link: string) {
            return {
                subject: `Connection link for ${Config.SITE_NAME}`,
                html: <p>
                    Hello,<br/>
                    <br/>
                    Please follow this link to connect to {Config.SITE_NAME} :<br/>
                    <a href={link}>{link}</a>
                </p>
            }
        },
        inviteEmail(link: string, dbName:string) {
            return {
                subject: `You have been invited on ${dbName}`,
                html: <p>
                    Hi,<br/>
                    <br/>
                    You are invited to participate to {dbName}.<br/>
                    Please click on <a href={link}>this link</a> to connect.
                </p>
            }
        }
    }