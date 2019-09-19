import {attributesMap, StructType} from "../model/types";
import {empty} from "../utils";
import {validationError, ValidationErrors} from "./validators";
import {Record, systemType} from "../model/instances";
import {IMessages} from "../i18n/messages";

export function * validateRecord(record: Record, schema:StructType, _:IMessages, isNew:boolean) : IterableIterator<ValidationErrors> {
    let attrMap = attributesMap(schema);
    let sysAttrMap = attributesMap(systemType());

    // No extra attributes ?
    for (let name in record) {
        if (!(name in attrMap)) {
            if (!(name in sysAttrMap)) {
                yield validationError(name, _.unknown_attribute + ": " + name);
            }
        } else {
            let attr = attrMap[name];
            let val = record [name];

            if (!attr.type.isValid(val)) {
                yield validationError(name, _.invalid_value + ": " + name + " : " + val);
            }
        }
    }

    for (let name in attrMap) {
        let attr = attrMap[name];

        if (!(name in record) && isNew && ! attr.readonly) {
            yield validationError(name, _.missing_attribute);
        }

        if (attr.isMandatory) {
            if ((name in record) && empty(record[name])) {
                yield validationError(name, _.mandatory_attribute);
            }
        }
    }
}