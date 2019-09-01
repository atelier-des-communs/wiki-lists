import {Express, Request} from "express";
import * as passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import {IUser} from "../../shared/model/user";
import * as bcrypt from "bcrypt-nodejs";
import {User} from "../../shared/model/user";
import {selectLanguage} from "../i18n/messages";
import {LOGIN_URL, REGISTER_URL, VALIDATION_ERROR_STATUS_CODE} from "../../shared/api";
import {ValidationErrors} from "../../shared/validators/validators";

export function setUp(app:Express) {

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use("local", localStrategy);

    passport.serializeUser((user:IUser, done: Function) => {
        if (user == null) {
            return done("Null user to serialize", false);
        }
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


    app.post(LOGIN_URL, function (req, res, next) {

        // i18n
        let _ = selectLanguage(req).messages;

        passport.authenticate("local", function(err, user, info) {

            if (err) {
                let errors : ValidationErrors = {};

                if (err == AuthError.USER_NOT_FOUND) {
                    errors.email = _.auth.userNotFound;
                } else if (err == AuthError.BAD_PASSWORD) {
                    errors.password = _.auth.wrongPassword;
                } else {
                    return res.status(500).send(`Unkwown error :${err}`)
                }
                return res.status(VALIDATION_ERROR_STATUS_CODE).json(errors);
            } else {
                return req.logIn(user, function (err) {
                    if (err) { return res.status(500).send(`Internal error :${err}`)}
                    return res.json(user);
                });
            }
        })(req, res, next);
    });

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

export interface LoginProps {
    email:string,
    password:string
}

enum AuthError {
    USER_NOT_FOUND = 1,
    BAD_PASSWORD = 2
}


function doLogin(req:Request, email:string, password:string, done:Function) {

    User.findOne({email:email}).exec()
        .then((user:IUser) => {
            if (!user) {
               return done(AuthError.USER_NOT_FOUND, false);
            }

            let passwordHash = user.passwordHash;
            delete user.passwordHash;

            comparePasswords(passwordHash, password, (error:Error, isMatch:boolean) => {
                if (error) {
                    return done(error, null)
                } else {
                    if (isMatch) {
                        return done(null, user)
                    } else {
                        return done(AuthError.BAD_PASSWORD, null)
                    }
                }
            });
        })
        .catch((err) => {return done(err)})
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