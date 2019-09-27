

declare module "redux-seamless-immutable" {
    export function combineReducers<S>(reducers: any): any;
}


declare module "debounce" {
    function debounce<F extends Function>(func: F, wait?: number, immediate?: boolean): F;
    namespace debounce {}
    export = debounce;
}

declare module "short-unique-id" {
    interface _ShortUniqueId {
        randomUUID(size:number) : string;
    }

    function ShortUniqueId(): _ShortUniqueId;
    export = ShortUniqueId;
}

declare module "react-leaflet-control" {
    interface ControlProps {
        position:string;
    }
    export class Control extends React.Component<ControlProps> {
    }
    export default Control;
}

declare module "redis-lru" {

    class Cache  {
        getOrSet<T>(key:string, func:() => T, maxAge:number) : Promise<T>;
    }

    export default function lru(redis:any, nbitems:number) : Cache;
}

declare module "json-stringify-deterministic" {
    export default function stringify(value:any) : string;
}