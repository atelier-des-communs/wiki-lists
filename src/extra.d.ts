
declare module "redux-seamless-immutable" {
    export function combineReducers<S>(reducers: any): any;
}


declare module "debounce" {
    function debounce<F extends Function>(func: F, wait?: number, immediate?: boolean): F;
    namespace debounce {}
    export = debounce;
}