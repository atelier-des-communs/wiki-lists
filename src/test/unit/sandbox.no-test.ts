import * as seamless from "seamless-immutable";

test("foo", () => {

    class A {
        b : number;
        constructor(b:number) {this.b = b}
        foo() {return this.b}
    }

    let foo = {

        a : new A(3),
        b: 1
    }

    let immut = seamless.from(foo);

    expect(immut.a.foo()).toEqual(3);

});