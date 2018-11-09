/** Helper wrappers around localStorage, for safe SSR rendering and type handling */
import {anyToBool} from "./utils";

export const safeStorage = {
    set: (key:string, value:any) => {
        localStorage.setItem(key, value + "");
    },

    get : (key:string) => {
      if (typeof localStorage == "undefined") {
          return null;
      }
      return localStorage.getItem(key);
    },

    getBool: (key:string, def:boolean=true) => {
        let value = safeStorage.get(key);
        if (value == null) {
            return def
        } else {
            let res = anyToBool(value);
            console.log(`Local storage value: ${value} res: ${res}`);
            return res;
        }
    }
};

