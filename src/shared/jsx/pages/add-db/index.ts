import {withAsyncImport} from "../../async/async-import-component";

export const AddDbPageAsync = withAsyncImport(() => {
    return import("./add-db").then(imp => imp.AddDbPage);
});