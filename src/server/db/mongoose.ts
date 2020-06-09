// Connect mongoose
import * as mongoose from "mongoose";
import config from "../config";
import * as shortid from "shortid";
import {IToken, IUser} from "../../shared/model/user";
import * as crypto from "crypto";

// token expiration in seconds
const TOKEN_EXPIRES = 60 * 30

mongoose.connect(`mongodb://${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`)
    .then(() =>  console.log('Mongoose connected'))
    .catch((err) => console.error(err));

const UserSchema: mongoose.Schema = new mongoose.Schema({
    _id: {type: String, default: shortid.generate},
    email: {type: String, unique: true},
});

export let User = mongoose.model<IUser & mongoose.Document>("User", UserSchema);

function token() {
    let res = crypto.randomBytes(36).toString("base64");

    // Base 64 URL
    return res
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}

export function expireDate(expireMinutes:number) {
    return new Date(Date.now()+ 1000 * expireMinutes);
}

const TokenSchema: mongoose.Schema = new mongoose.Schema<IToken>({
    _id: {type: String, default: token},
    email: {type: String},
    redirect : {type:String},
    expires : {type: Date, expires: 0, default:()=> {return expireDate(TOKEN_EXPIRES)}}
});

export let Token = mongoose.model<IToken & mongoose.Document>("Token", TokenSchema);


