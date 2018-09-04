/*
 * Abstract component that requires async data
 * The promises it fires will be gathered on the global context enabling SSR to wait of
 * all of them to resolve and re-rendering.
 */
import * as React from "react";
import {GlobalContextProps, GlobalContextProviderProps} from "../context/global-context";
import {Loader} from "semantic-ui-react";

export abstract class AsyncComponent<T extends GlobalContextProps> extends React.Component<T> {

    state : {loading:boolean};

    constructor(props: T) {
        super(props);
        this.state = {loading:false};
    }

    /** Should look at props / state, and return null if no loading is required */
    abstract fetchData() : null | Promise<any> | Promise<any>[];

    componentWillMount() {
        let promise = this.fetchData();
        if (promise) {

            console.log("Added promise", promise, this);

            if (promise instanceof Array) {
                if (promise.length == 0) {
                    return;
                } else {
                    promise = Promise.all(promise);
                }
            }

            this.setState({loading:true});

            this.props.promises.push(promise);
            promise.then(() => {

                console.log("Promise finished !", promise, this);
                this.setState({loading:false});
            });
        }
    }

    render() {
       if (this.state.loading) {
           return <Loader active />
       } else {
           return this.renderLoaded();
       }
    }

    abstract renderLoaded(): false | JSX.Element;
}


// Higher order function wrapping a component with async data fetching
export function withAsync<P extends GlobalContextProps>(
    fetchData:(props: P) => null | Promise<any> | Promise<any>[])
{
    return (WrappedComponent: React.ComponentType<P>): React.ComponentClass<P> => {
        return class extends AsyncComponent<P> {

            fetchData() {
                return fetchData(this.props);
            }

            public renderLoaded() {
                return <WrappedComponent {...this.props} />;
            }
        };
    }


}
