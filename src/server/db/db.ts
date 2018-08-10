import {StructType, BooleanType, Type, NumberType, Attribute, TextType} from "../../shared/model/types";
import {IState} from "../../shared/redux";

export let schema = new StructType();
schema.addAttribute(new Attribute("boolean", new BooleanType()));
schema.addAttribute(new Attribute("text", new TextType()));
schema.addAttribute(new Attribute("number", new NumberType()));

export let data = {
    "1" : {
        "_id" : 1,
        "boolean": true,
        "text": "foo",
        "number": 123
    },
    "2" : {
        "_id" : 2,
        "boolean": false,
        "text": "bar",
        "number": 456
    }
};

export const initialState : IState = {
    items:data,
    schema
};
