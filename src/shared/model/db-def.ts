import {StructType} from "./types";
import {AccessRight} from "../access";
import {extend} from "lodash";

export interface DbSettings {
    label: string;
    description: string;
}

export class DbDefinition implements DbSettings {

    label: string;
    description: string;

    /** Shortname of the db */
    name: string;
    schema: StructType;
    secret?: string;
    rights?: AccessRight[];


    constructor(init: DbDefinition) {
        extend(this, init);
    }
}