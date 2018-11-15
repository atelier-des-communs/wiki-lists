import {attributesMap, StructType} from "../model/types";
import {empty} from "../utils";
import {ValidationError} from "./validators";
import {Record, systemType} from "../model/instances";
import {IMessages} from "../i18n/messages";

export function * validateRecord(record: Record, schema:StructType, _:IMessages, isNew:boolean) : IterableIterator<ValidationError> {
    let attrMap = attributesMap(schema);
    let sysAttrMap = attributesMap(systemType(_));

    // No extra attributes ?
    for (let name in record) {
        if (!(name in attrMap)) {
            if (!(name in sysAttrMap)) {
                yield new ValidationError(name, _.unknown_attribute + ": " + name);
            }
        } else {
            let attr = attrMap[name];
            let val = record [name];

            // Validate the value
            // TODO
        }
    }

    for (let name in attrMap) {
        let attr = attrMap[name];

        if (!(name in record) && isNew) {
            yield new ValidationError(name, _.missing_attribute);
        }

        if (attr.isMandatory) {
            if ((name in record) && empty(record[name])) {
                yield new ValidationError(name, _.mandatory_attribute);
            }
        }
    }
}