import {post} from "./common";
import {LOGIN_URL} from "../../shared/api";
import {LoginProps} from "../../server/rest/auth";
import {IUser} from "../../shared/model/user";

/** Returns the user profile */
export async function login(login:LoginProps) : Promise<IUser> {
    return await post<IUser>(LOGIN_URL, login);
}

