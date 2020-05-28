import {StructType} from "./types";
import {AccessGroup, AccessRight, AccessRightsKind} from "../access";
import {extend} from "lodash";
import {classTag} from '../serializer';


export interface DbSettings {
    label: string;
    description: string;
}


@classTag("DbDefinition")
export class DbDefinition implements DbSettings {

    label: string;
    description: string;

    /** Shortname of the db */
    name: string;
    schema: StructType;
    accessRights ?: AccessRightsKind;

    // Admin ids
    admins?: string[];

    constructor(init: DbDefinition) {
        extend(this, init);
    }
}
