/*
 * Abstract component that requires async data
 * The promises it fires will be gathered on the global context enabling SSR to wait of
 * all of them to resolve and re-rendering.
 */
import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Loader} from "semantic-ui-react";

export abstract class AsyncDataComponent<T extends GlobalContextProps> extends React.Component<T> {

    state : {loading:boolean};

    constructor(props: T) {
        super(props);
        this.state = {loading:false};
    }

    /** Should look at props / state, and return null if no loading is required */
    abstract fetchData() : null | Promise<{}> |  Promise<{}>[];

    componentWillMount() {
        let promises  = this.fetchData();
        let singlePromise : Promise<{}>;
        if (promises) {

            // Reduce multiple promises into single one
            if (promises instanceof Array) {
                if (promises.length == 0) {
                    return;
                } else {
                    singlePromise = Promise.all(promises);
                }
            } else {
                singlePromise = promises;
            }

            this.setState({loading:true});

            this.props.promises.push(
                singlePromise.then(() => {
                    this.setState({loading:false});
                }));
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
export function withAsyncData<P>(
    fetchData:(props: Readonly<P & GlobalContextProps>) => null | Promise<any> | Promise<any>[])
{
    return (WrappedComponent: React.ComponentType<P>): React.ComponentClass<P> => {

        let resClass = class extends AsyncDataComponent<P & GlobalContextProps> {

            fetchData() {
                return fetchData(this.props);
            }

            public renderLoaded() {
                return <WrappedComponent {...this.props} />;
            }
        }

        return withGlobalContext(resClass);
    }
}
