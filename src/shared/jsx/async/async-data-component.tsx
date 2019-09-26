/*
 * Abstract component that requires async data
 * The promises it fires are stored in the global context enabling SSR to wait of
 * all of them to resolve and re-rendering.
 */
import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Loader, Dimmer} from "semantic-ui-react";

export abstract class AsyncDataComponent<T extends GlobalContextProps> extends React.Component<T> {

    className : string;

    loading:boolean;

    constructor(props: T, className:string=null) {
        super(props);
        this.className = className;
        console.debug("Instantiated " + (this.className));
    }

    /** Should look at props / state, and return null if no loading is required */
    abstract fetchData(nextProps: T, nextState:{}) :  Promise<{}>;

    doFetch(props:T, state:{}): void {
        // Don't fetch data twice
        if (this.loading) {
            return;
        }

        let promise = this.fetchData(props, state);

        console.debug("Getting promise for " + this.className, promise);

        if (promise) {
            this.loading = true;

            this.props.promises.push(
                promise.then(() => {
                    console.debug("Async data fetch finished for " + this.className);
                    this.loading = false;
                }));
        }
    }

    componentWillMount(): void {
        this.doFetch(this.props, this.state);
    }

    componentWillUpdate(nextProps: Readonly<T>, nextState: Readonly<{}>, nextContext: any): void {
        this.doFetch(nextProps, nextState);
    }


    render() {
        let child = this.renderLoaded();
        return <div>
                {child}
            </div>
    }

    abstract renderLoaded(): false | JSX.Element;
}


// Higher order function wrapping a component with async data fetching
export function withAsyncData<P>(
    fetchData:(props: Readonly<P & GlobalContextProps>) => Promise<any>)
{
    return (WrappedComponent: React.ComponentType<P>, name:string=null): React.ComponentClass<P> => {

        class WithAsyncData extends AsyncDataComponent<P & GlobalContextProps> {


            constructor(props: P & GlobalContextProps) {
                super(props, name || (WrappedComponent as any).name + "#async");
            }


            fetchData(props:P & GlobalContextProps) {
                return fetchData(props);
            }

            public renderLoaded() {
                return <WrappedComponent {...this.props} />;
            }
        }

        return withGlobalContext(WithAsyncData);
    }
}
