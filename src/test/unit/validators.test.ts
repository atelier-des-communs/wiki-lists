import {mergeErrors, ValidationErrors} from "../../shared/validators/validators";


test("Should merge errors", () => {


    let err1 : ValidationErrors = {
        foo : "foo",
        bar : "bar"
    };
    let err2 : ValidationErrors = {
        foo : "foo2",
        bar2 : "bar2"
    };

    let merged : ValidationErrors = {
        foo : ["foo", "foo2"],
        bar: "bar",
        bar2 : "bar2"
    };

    expect(mergeErrors([err1, err2])).toEqual(merged);
});
