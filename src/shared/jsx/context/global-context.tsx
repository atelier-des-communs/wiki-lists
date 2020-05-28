import * as React from "react";
import {Store} from "react-redux";
import {IState} from "../../redux";
import {DataFetcher, SharedConfig} from "../../api";
import {IMessages, Language} from "../../i18n/messages";
import {IUser} from "../../model/user";


// Generic definition of hanlder to set title and metas
export interface HeadSetter {
    setTitle : (title:string) => void;
    setDescription : (description:string) => void;
    setStatusCode: (code:number) => void;
}

export interface ICookies {
    get(name:string) : string;
    set(name:string, value:string) : void;
}

// Global props, passed down to all pages & components, via React "context" mecanism
export interface GlobalContextProps  {

    messages: IMessages,

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

    /** Current land */
    lang : string;

    /** List of supported languages */
    supportedLanguages: Language[];

    user:IUser;

    config: SharedConfig;
}

const GlobalContext: React.Context<GlobalContextProps> = React.createContext(null);


/** Global provider */
export class GlobalContextProvider extends React.Component<GlobalContextProps>{

    constructor(props:GlobalContextProps) {
        super(props);
    }

    render() {
        return <GlobalContext.Provider value={this.props}>
            {this.props.children}
        </GlobalContext.Provider>
    }

}

/** Higher order component, injecting the global context as root props in any component */
export function withGlobalContext<P> (
    WrappedComponent: React.ComponentType<P & GlobalContextProps>,
): React.ComponentClass<P> {
    return class extends React.Component<P> {
        public render() {
            return <GlobalContext.Consumer>
                {(context) => <WrappedComponent {...context} {...this.props}  />}
            </GlobalContext.Consumer>
        }
    };
}

