import * as React from "react";
import {Store} from "react-redux";
import {IState} from "../../redux";
import * as PropTypes from "prop-types";
import {DataFetcher} from "../../api";
import {DefaultMessages} from "../../i18n/messages";


// Generic definition of hanlder to set title and metas
export interface HeadSetter {
    setTitle : (title:string) => void;
    setDescription : (description:string) => void;
}

export interface ICookies {
    get(name:string) : string;
    set(name:string, value:string) : void;
}

// Global props, passed down to all pages & components, via React "context" mecanism
export interface GlobalContextProps  {

    messages: DefaultMessages,

    /** Simple interface for setting title and meta HTML tags */
    head: HeadSetter,


    /** Direct access to redux store */
    store: Store<IState>;

    /* Client API for reading data */
    dataFetcher : DataFetcher;

    /* Promises getting accumulated by AsyncComponents, for SSR to wait for their completion */
    promises : Promise<any>[];

    /** Generic cookies interfaces served differently on SSR and client */
    cookies : ICookies;

    lang : string;
}

export interface GlobalContextProviderProps {
    global:GlobalContextProps;
}

/** Global provider */
export class GlobalContextProvider extends React.Component<GlobalContextProviderProps>{

    constructor(props:GlobalContextProviderProps) {
        super(props);
    }

    static  childContextTypes = {
        global: PropTypes.object
    };

    getChildContext() : GlobalContextProviderProps  {
        return {global:this.props.global}
    }

    render() {
        return <>
            {this.props.children}
        </>
    }

}

/** Higher order component, injecting the global context as root props in any component */
export function withGlobalContext <P> (
    WrappedComponent: React.ComponentType<P & GlobalContextProps>,
): React.ComponentClass<P> {
    return class extends React.Component<P> {

        context: GlobalContextProviderProps;

        static  contextTypes = {
            global: PropTypes.object
        };

        public render() {
            return <WrappedComponent {...this.context.global} {...this.props}  />;
        }
    };
}

