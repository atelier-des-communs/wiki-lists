import {Attribute, attributesMap, EnumType, StructType, Types} from "../model/types";
import {empty, isIn} from "../utils";
import {_} from "../i18n/messages";
import {ValidationError} from "./validators";
import {Record, systemType} from "../model/instances";

export function * validateRecord(record: Record, schema:StructType) : IterableIterator<ValidationError> {
    let attrMap = attributesMap(schema);
    let sysAttrMap = attributesMap(systemType);

    for (let name in record) {
        if (!(name in attrMap)) {
            if (!(name in sysAttrMap)) {
                yield new ValidationError(name, _.unknown_attribute + ": " + name);
            }
        } else {
            let attr = attrMap[name];
            let val = record [name];

        }
    }

    for (let name in attrMap) {
        let attr = attrMap[name];
        if (attr.isMandatory) {
            if (!(name in record) || empty(record[name])) {
                yield new ValidationError(name, _.mandatory_attribute);
            }
        }
    }
}