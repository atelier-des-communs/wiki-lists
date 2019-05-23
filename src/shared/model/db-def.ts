import {StructType} from "./types";
import {AccessRight} from "../access";
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
    secret?: string;
    rights?: AccessRight[];


    constructor(init: DbDefinition) {
        extend(this, init);
    }
}
