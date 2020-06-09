import {isIn, Map} from "./utils";
import {DbProps} from "./jsx/common-props";
import {DbDefinition} from "./model/db-def";
import {UpdateUserAction} from "./redux";
import {IUser} from "./model/user";
import {Record} from "./model/instances";
import {clone} from "lodash";

export enum AccessRight {
    VIEW="view", ADD="add", EDIT="edit", DELETE="delete", ADMIN="admin"
}

export enum AccessGroup {
    ANY="any",
    CONNECTED="connected",
    AUTHOR="author",
    ADMIN="admin",
    MEMBERS="members"
}

export type AccessRights = Map<AccessGroup[]>;

export enum AccessRightsKind {
    WIKI="wiki", COLLABORATIVE="collaborative", READ_ONLY="read_only"
}

export let ACCESS_RIGHTS : Map<AccessRights> = {
    [AccessRightsKind.READ_ONLY] : {
        [AccessRight.VIEW]: [AccessGroup.ANY],
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
        [AccessRight.ADD] : [AccessGroup.CONNECTED],
        [AccessRight.EDIT] : [AccessGroup.AUTHOR],
        [AccessRight.DELETE] : [AccessGroup.AUTHOR],
    }
}



export function hasRecordRight(dbDef: DbDefinition, user:IUser, record:Record, right:AccessRight) : boolean {
    if (user && dbDef.admins && isIn(dbDef.admins, user._id)) {
        return true
    }
    let kind = dbDef.accessRights || AccessRightsKind.WIKI;
    let accessRights : AccessRights = ACCESS_RIGHTS[kind];
    let authorizedGroups = clone(accessRights[right]);
    if (!authorizedGroups) {
        return false;
    }

    // Private ? Downgrade ANY and CONNECTED to MEMBERS
    if (dbDef.private) {
        authorizedGroups = authorizedGroups.map((group)=>
            (group == AccessGroup.ANY || group == AccessGroup.CONNECTED)
                ? AccessGroup.MEMBERS : group);
    }

    let actualGroups = [AccessGroup.ANY]
    if (user) {
        actualGroups.push(AccessGroup.CONNECTED);
        if (dbDef.member_emails && isIn(dbDef.member_emails, user.email)) {
            actualGroups.push(AccessGroup.MEMBERS);
        }
        if (record && user._id == record._user) {
            actualGroups.push(AccessGroup.AUTHOR);
        }
    }

    console.log(right, actualGroups, authorizedGroups);

    return actualGroups.some(group => isIn(authorizedGroups, group))
}

export function hasDbRight(dbDef: DbDefinition, user: IUser, right:AccessRight) : boolean {
    return hasRecordRight(dbDef, user, null, right);
}



