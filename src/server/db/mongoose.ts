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
    let res = crypto.randomBytes(48).toString("base64");

    // Base 64 URL
    return res
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}

const TokenSchema: mongoose.Schema = new mongoose.Schema({
    _id: {type: String, default: token},
    email: {type: String},
    createdAt : {type: Date, expires: TOKEN_EXPIRES, default:Date.now}
});

export let Token = mongoose.model<IToken & mongoose.Document>("Token", TokenSchema);


