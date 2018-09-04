import {AuthProvider} from "../../access";
import * as React from "react";
import {Store} from "react-redux";
import {IState} from "../../redux";
import * as PropTypes from "prop-types";
import {ReduxEventsProps} from "../common-props";

// Global props, passed to the main app, as is
export interface GlobalContextProps  {
    dbName:string,
    auth:AuthProvider;
    store: Store<IState>;
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

/** Higher order component, injecting the global context as root props */
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

