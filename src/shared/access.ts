import {isIn, Map} from "./utils";
import {DbProps} from "./jsx/common-props";
import {User} from "../server/db/mongoose";
import {DbDefinition} from "./model/db-def";
import {UpdateUserAction} from "./redux";
import {IUser} from "./model/user";
import {Record} from "./model/instances";

export enum AccessRight {
    VIEW="view", ADD="add", EDIT="edit", DELETE="delete", ADMIN="admin"
}

export enum AccessGroup {
    ANY="any",
    AUTHOR="author",
    ADMIN="admin",
}

export type AccessRights = Map<AccessGroup[]>;

export enum AccessRightsKind {
    WIKI="wiki", COLLABORATIVE="collaborative", READ_ONLY="read_only"
}

export let ACCESS_RIGHTS : Map<AccessRights> = {
    [AccessRightsKind.READ_ONLY] : {
        [AccessRight.VIEW]: [AccessGroup.ADMIN],
        [AccessRight.ADD] : [AccessGroup.ADMIN],
        [AccessRight.EDIT] : [AccessGroup.ADMIN],
        [AccessRight.DELETE] : [AccessGroup.ADMIN],
    },
    [AccessRightsKind.WIKI] : {
        [AccessRight.VIEW]: [AccessGroup.ANY],
        [AccessRight.ADD] : [AccessGroup.ANY],
        [AccessRight.EDIT] : [AccessGroup.ANY],
        [AccessRight.DELETE] : [AccessGroup.ANY],
    },
    [AccessRightsKind.COLLABORATIVE] : {
        [AccessRight.VIEW]: [AccessGroup.ANY],
        [AccessRight.ADD] : [AccessGroup.ANY],
        [AccessRight.EDIT] : [AccessGroup.AUTHOR],
        [AccessRight.DELETE] : [AccessGroup.AUTHOR],
    }
}

export function hasDbRight(dbDef: DbDefinition, user: IUser, right:AccessRight) {
    if (user && dbDef.admins && isIn(dbDef.admins, user._id)) {
        return true
    }
    let kind = dbDef.accessRights || AccessRightsKind.WIKI;
    let accessRights : AccessRights = ACCESS_RIGHTS[kind];
    let groups = accessRights[right];
    if (!groups) {
        return false;
    }
    return isIn(groups, AccessGroup.ANY);
}

export function hasRecordRight(dbDef: DbDefinition, user:IUser, record:Record, right:AccessRight) {
    if (user && dbDef.admins && isIn(dbDef.admins, user._id)) {
        return true
    }
    let kind = dbDef.accessRights || AccessRightsKind.WIKI;
    let accessRights : AccessRights = ACCESS_RIGHTS[kind];
    let authorizedGroups = accessRights[right];
    if (!authorizedGroups) {
        return false;
    }

    let actualGroups = [AccessGroup.ANY]
    if (user && user._id == record._user) {
        actualGroups.push(AccessGroup.AUTHOR);
    }

    for (let group of actualGroups) {
        if (isIn(authorizedGroups, group)) {
            return true;
        }
    }

    return false;
}



