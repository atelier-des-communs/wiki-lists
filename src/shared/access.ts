import {isIn} from "./utils";
import {DbProps} from "./jsx/common-props";

export enum AccessRight {
    VIEW="view", EDIT="edit", DELETE="delete", ADMIN="admin"
}

// Check a given right against the rights for the current user against current DB
export function hasRight(props: DbProps, right:AccessRight) {
    return isIn(props.db.userRights, right);
}



