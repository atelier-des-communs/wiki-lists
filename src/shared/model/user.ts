import * as mongoose from "mongoose";
import * as shortid from "shortid";
import {config} from "../../server/config";


// Connect mongoose
mongoose.connect(`mongodb://${config.DB_HOST}:${config.DB_PORT}/`)
    .then(() =>  console.log('Mongoose connected'))
    .catch((err) => console.error(err));

export interface IUser extends mongoose.Document {
    _id: string;
    email:string;
    passwordHash:string;
    confirmed:boolean;
    confirmationToken: string;
    confirmationTokenDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: mongoose.Schema = new mongoose.Schema({
        _id: {
            type: String,
            default: shortid.generate
        },
        email: {type: String, unique: true},
        name: {type: String, unique: true},
        passwordHash: String,
        confirmed: {type: Boolean, default: false},
        confirmationToken: String,
        confirmationTokenDate: Date,

    },
    {
        timestamps:
            {
                createdAt: "createdAt",
                updatedAt: "updatedAt"
            }
    });


export let User =  mongoose.model<IUser>("User", UserSchema);
