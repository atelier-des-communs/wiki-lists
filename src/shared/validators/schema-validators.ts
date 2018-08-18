import {Attribute, EnumType, StructType, Types} from "../model/types";
import {empty} from "../utils";
import {_} from "../i18n/messages";
import {ValidationError} from "./validators";

const ATTRIBUTE_NAMES_PATTERN = /^[a-zA-Z0-9_\-]+$/;

export function * validateSchemaAttributes(attributes : Attribute[]) : IterableIterator<ValidationError> {

    for (let index in attributes) {

        let attr = attributes[index];

        if (empty(attr.name)) {
            yield new ValidationError(`${index}.name`, _.attribute_name_mandatory);
        } else if (! ATTRIBUTE_NAMES_PATTERN.test(attr.name)) {
            yield new ValidationError(`${index}.name`, _.attribute_name_format);
        }
        if (!attr.type || !attr.type.tag) {
            yield new ValidationError(`${index}.type`, _.missing_type);
        } else switch(attr.type.tag) {
            case Types.ENUM :
                let type = attr.type as EnumType;
                if ((!type.values) || type.values.length == 0) {
                    yield new ValidationError(`${index}.type.values`, _.missing_enum_values);
                }
        }
    }
}