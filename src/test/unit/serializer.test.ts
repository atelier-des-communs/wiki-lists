import {clearRegistry, registerClass, toJsonWithTypes, toObjWithTypes} from "../../shared/serializer";

class A {};

beforeEach(() => clearRegistry());

test("Should not touch plain objects when serializing", () => {

    let obj = {
        a : 1,
        b : true,
        c : "foo",
        d : {
            a : 2,
            b : 3
        },
        e: [1, false]};

    expect(toJsonWithTypes(obj)).toEqual(obj);
});

test("Should not touch plain objects when unserializing", () => {

    let obj = {
        a : 1,
        b : true,
        c : "foo",
        d : {
            a : 2,
            b : 3
        },
        e: [1, false]};

    expect(toObjWithTypes(obj)).toEqual(obj);
});


test("Should add type info", () => {

    class A {
        b = 1
    }

    registerClass(A, "a")

    let obj = {a : new A()};
    let json = {
        a : {
            "@class": "a",
                b : 1, }};

    expect(toJsonWithTypes(obj)).toEqual(json);
    expect(toObjWithTypes(json)).toEqual(obj);
});

test("Should parse type info and setup methods", () => {

    class A {
        b : null;
        getB() {
            return this.b;
        }
    }

    registerClass(A, "a")

    let json = {
        a :{
            "@class": "a",
             b: 2, }};

    let obj = toObjWithTypes(json);

    expect((obj.a as any).getB()).toEqual(2);
});

test("Should serialize with custom serializer", () => {

    class B {
        constructor(value: number) {
            this.value = value;
        }
        value: number;
    }

    registerClass(B, "b", {
        toJson(b:B) {
            return {value : b.value + 1};
        },
        fromJson(json:any) {
            return new B(json.value - 1)
        }
    });

    let obj = {b : new B(1)};
    let json = {b : {
        "@class" : "b",
            value : 2}
    };

    expect(toJsonWithTypes(obj)).toEqual(json);
    expect(toObjWithTypes(json)).toEqual(obj);
});