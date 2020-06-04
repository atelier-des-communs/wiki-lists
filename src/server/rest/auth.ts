import {Express} from "express";

import {selectLanguage} from "../i18n/messages";
import {LOGIN_PAGE_PATH, LOGIN_URL, LOGOUT_URL, SEND_CONNECT_LINK} from "../../shared/api";
import Config from "../config";
import {sendMail} from "../email/email";
import {Token, User} from "../db/mongoose";
import {emailTemplates} from "../email/templates";
import {Router} from "express";

// Expiration of link in minutes
const LINK_EXPIRATION = 30



let router = Router();

router.get(LOGIN_URL, async function (req, res) {

        // i18n
        let _ = selectLanguage(req).messages;

        let tokenStr = req.params.token;

        // Get it
        let token = await Token.findOne({_id:tokenStr});

        if (token == null) {
            req.flash("error", _.auth.expired);
            console.error("bad link");
            res.redirect(403, LOGIN_PAGE_PATH);
        }

        // Get or create user
        let user = await User.findOne({email: token.email});
        if (user == null) {
            user = await User.create({email: token.email});
        }

        console.log("Logged ! ", user);

        // Save user to session
        req.session.user = user;
        res.redirect("/");

    });

router.get(LOGOUT_URL, function (req, res, next) {

        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect("/");
            }
        });

    });

router.post(SEND_CONNECT_LINK, async function (req, res, next) {

        let email = req.query.email;

        let token = await Token.create({email});

        let base_url = Config.BASE_URL.replace(/\/$/, "")
        let link = `${base_url}${LOGIN_URL.replace(":token", token._id)}`;

        let emailContent = emailTemplates[req.language].loginEmail(link);

        sendMail(email, emailContent).then(() => {
            res.send("OK");
        }).catch(reason => {
            next(reason);
        });

    });

export default router;



