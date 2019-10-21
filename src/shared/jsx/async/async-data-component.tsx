/*
 * Abstract component that requires async data
 * The promises it fires are stored in the global context enabling SSR to wait of
 * all of them to resolve and re-rendering.
 */
import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Loader, Dimmer} from "semantic-ui-react";
import {isPromise} from "../../utils";

/** Asynchronous component handling correctly promises for SSR. */
export abstract class AsyncDataComponent<T extends GlobalContextProps, DataType> extends React.Component<T> {

    className : string;

    loading:boolean;

    asyncData : DataType;

    constructor(props: T, className:string=null) {
        super(props);
        if (className) {
            this.className = className;
        } else {
            this.className = (this.constructor as any).name;
        }
        console.debug("Instantiated " + (this.className));
    }

    /**
     *  Should either return data right away, or return a promise.
     *  If a promise is returned, it will be queued and prosessed until there it no more promise :
     *  Hence, this method should internally use a cache system with the state, so the state might eventually be ready
     *  on SSR for full render.
     *  In case of "infinite" loop, the SSR will still stop after a few fetch process (5 or so) and return an incomplete page
     */
    abstract fetchData(nextProps: T, nextState:{}) :  Promise<DataType> | DataType;

    doFetch(props:T, state:{}): void {
        // Don't fetch data twice
        if (this.loading) {
            return;
        }

        let res = this.fetchData(props, state);

        console.debug("Async Fetched data for", this.className, res);

        if (isPromise(res)) {
            let promise = res as Promise<DataType>;
            this.loading = true;

            this.props.promises.push(
                promise.then((data) => {
                    this.loading = false;
                    this.asyncData = data;

                    console.debug("Async Data arrived for", this.className, data);

                    // Trigger update
                    this.setState({});
                }).catch((e) => {
                    this.setState({loading:false});
                    throw e;
            }));
        } else {
            this.asyncData=res as DataType;
        }
    }

    componentWillMount(): void {
        this.doFetch(this.props, this.state);
    }

    componentWillUpdate(nextProps: Readonly<T>, nextState: Readonly<{}>, nextContext: any): void {
        this.doFetch(nextProps, nextState);
    }

    abstract renderLoaded() : React.ReactNode;

    render() {
        return <div>
            {this.loading && <div style={{position:'absolute', borderTop:"2px solid red"}}> </div>}
            {this.renderLoaded()}
        </div>
    }


}


// Higher order function wrapping a component with async data fetching
// FIXME: remove this, too much complex
export function withAsyncData<OwnProps,AsyncProps>(
    fetchData:(props: Readonly<OwnProps & GlobalContextProps>) => AsyncProps | Promise<AsyncProps>)
{
    return (WrappedComponent: React.ComponentType<AsyncProps & OwnProps>, name:string=null): React.ComponentClass<OwnProps> => {

        class WithAsyncData extends AsyncDataComponent<OwnProps & GlobalContextProps, AsyncProps> {


            constructor(props: OwnProps & GlobalContextProps) {
                super(props, name || (WrappedComponent as any).name + "#async");
            }


            fetchData(props:OwnProps & GlobalContextProps) {
                return fetchData(props);
            }

            public renderLoaded() {
                return <WrappedComponent {...this.props} {...this.asyncData} />;
            }
        }

        return withGlobalContext(WithAsyncData);
    }
}
