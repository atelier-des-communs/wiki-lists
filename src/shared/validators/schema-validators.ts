import {Attribute, EnumType, Types} from "../model/types";
import {empty, isIn} from "../utils";
import {validationError, ValidationErrors} from "./validators";
import {IMessages} from "../i18n/messages";

const ATTRIBUTE_NAMES_PATTERN = /^[a-zA-Z0-9_\-]+$/;

// FIXME: Awful
export function * validateSchemaAttributes(attributes : Attribute[], _:IMessages) : IterableIterator<ValidationErrors> {

    let foundName = false;

    let attrNames : string[] = [];

    for (let index in attributes) {

        let attr = attributes[index];

        if (attr.isName) {
            foundName = true;
        }

        if (isIn(attrNames, attr.name)) {
            yield validationError(`${index}.name`, _.duplicate_attribute_name);
        }
        attrNames.push(attr.name);

        if (empty(attr.name)) {
            yield validationError(`${index}.name`, _.attribute_name_mandatory);

        } else if (! ATTRIBUTE_NAMES_PATTERN.test(attr.name)) {
            yield validationError(`${index}.name`, _.attribute_name_format);
        }
        if (!attr.type || !attr.type.tag) {
            yield  validationError(`${index}.type`, _.missing_type);

        } else switch(attr.type.tag) {
            case Types.ENUM :
                let type = attr.type as EnumType;
                if ((!type.values) || type.values.length < 2) {

                    yield validationError(`${index}.type.values`, _.missing_enum_values);
                } else {
                    for (let enumIdx=0; enumIdx < type.values.length;enumIdx++) {
                        let enumVal = type.values[enumIdx];
                        if (empty(enumVal.value) || empty(enumVal.label)) {
                            yield validationError(`${index}.type.values.${enumIdx}.value`, _.empty_enum_value);
                        }
                    }
                }
        }
    }

    if (!foundName) {
        yield validationError(``, _.missing_name);
    }
}