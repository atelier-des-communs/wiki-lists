import {isIn} from "./utils";
import {DbProps} from "./jsx/common-props";

export enum AccessRight {
    VIEW="view", EDIT="edit", DELETE="delete", ADMIN="admin"
}


export function hasRight(props: DbProps, right:AccessRight) {
    return isIn(props.db.rights, right);
}



