import {Express, Request} from "express";
import * as passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import {IUser} from "../../shared/model/user";
import * as bcrypt from "bcrypt-nodejs";
import {User} from "../../shared/model/user";
import {selectLanguage} from "../i18n/messages";
import {LOGIN_URL, REGISTER_URL} from "../../shared/api";

export function setUp(app:Express) {

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use("local", localStrategy);

    passport.serializeUser((user:IUser, done: Function) => {
        done(null, user._id);
    });

    passport.deserializeUser((id:String, done: Function) => {
        User.findOne({_id:id}).exec()
            .then((user:IUser) => {
                delete user.passwordHash;
                done(null, user)
            })
            .catch((err) => {done(err)})
    });


    app.post(LOGIN_URL,
        passport.authenticate("local"),
        (req, res) => {res.json(req.user)});

    app.post(REGISTER_URL, async (req, res) => {

        let userProps : IUser = req.body;

        // Hash password
        if ((userProps as any).password) {
            userProps.passwordHash = await hash(req.body.password);
        }

        let user =  User.create(userProps)
            .then((user) => {res.json(user)})
            .catch((err) => {res.json(err)});
    });
}

function doLogin(req:Request, email:string, password:string, done:Function) {

    // i18n
    let _ = selectLanguage(req).messages;

    User.findOne({email:email}).exec()
        .then((user:IUser) => {
            if (!user) {
               return done(null, false, _.auth.userNotFound);
            }
            let passwordHash = user.passwordHash;
            delete user.passwordHash;
            comparePasswords(passwordHash, password, (error:Error, isMatch:boolean) => {
                if (error) {
                    return done(error)
                } else {
                    if (isMatch) {
                        return done(null, user)
                    } else {
                        return done(null, false, _.auth.wrongPassword)
                    }
                }
            });
        })
        .catch((err) => {done(err)})
}


let localStrategy = new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true},
    doLogin);

function comparePasswords(passwordHash:string, passw:string, cb:Function) {
    bcrypt.compare(passw, passwordHash, function (err:Error, isMatch:boolean) {
        if (err) {
            return cb(err);
        }
        return cb(null, isMatch);
    });
}

/** Promisify the salt algorithm */
function hash(password:string) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
        bcrypt.genSalt(10, function (err:Error, salt:string) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(password, salt, null, function (err:Error, hash:string) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
}