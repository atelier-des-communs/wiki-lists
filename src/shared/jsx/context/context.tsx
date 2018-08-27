import {AuthProvider} from "../../access";
import * as React from "react";
import {Store} from "react-redux";
import {IState} from "../../redux";
import * as PropTypes from "prop-types";

export interface GlobalContext {
    auth:AuthProvider;
    store: Store<IState>;
}

export interface GlobalContextProps {
    global : GlobalContext;
}


/** Global provider */
export class GlobalContextProvider extends React.Component<GlobalContextProps>{

    constructor(props:GlobalContextProps) {
        super(props);
    }

    static  childContextTypes = {
        global: PropTypes.object
    };

    getChildContext() : GlobalContextProps {
        return {global: this.props.global}
    }

    render() {
        return <>
            {this.props.children}
        </>
    }

}

/** Higher order component, injecting the global context */
export function withGlobalContext <P> (
    WrappedComponent: React.ComponentType<P & GlobalContextProps>,
): React.ComponentClass<P> {
    return class extends React.Component<P> {

        context: GlobalContextProps;

        static  contextTypes = {
            global: PropTypes.object
        };

        public render() {
            return <WrappedComponent {...this.props} global={this.context.global} />;
        }
    };
}

