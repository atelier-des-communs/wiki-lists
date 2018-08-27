import {isIn} from "./utils";

export enum AccessRight {
    VIEW="view", EDIT="edit", DELETE="delete", ADMIN="admin"
}

export interface AuthProvider {
     hasRight : (right:AccessRight) => boolean;
}

export class SimpleUserRights implements AuthProvider{
    rights : AccessRight[];
    constructor(rights:AccessRight[]) {
        this.rights = rights
    }
    hasRight(right: AccessRight) {
        return isIn(this.rights, right);
    }
}



