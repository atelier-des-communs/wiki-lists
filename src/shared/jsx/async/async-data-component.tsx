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
export abstract class AsyncDataComponent<T extends GlobalContextProps, AsyncDataType> extends React.Component<T> {

    className : string;

    loading:boolean;

    _isMounted : boolean = false;

    // Data that will be fetched on mounting
    asyncData : AsyncDataType;

    constructor(props: T, className:string=null) {
        super(props);
        if (className) {
            this.className = className;
        } else {
            this.className = (this.constructor as any).name;
        }
        console.debug("Instantiated " + (this.className));
    }

    componentDidMount() {
        this._isMounted = true;
    }

    /**
     *  Should either return data right away, or return a promise.
     *  If a promise is returned, it will be queued and prosessed until there it no more promise :
     *  Hence, this method should internally use a cache system with the state, so the state might eventually be ready
     *  on SSR for full render.
     *  In case of "infinite" loop, the SSR will still stop after a few fetch process (5 or so) and return an incomplete page
     */
    abstract fetchData(nextProps: T, nextState:{}) :  Promise<AsyncDataType> | AsyncDataType;

    doFetch(props:T, state:{}): void {

        // Don't fetch data twice
        if (this.loading) {
            return;
        }

        let res = this.fetchData(props, state);

        console.debug("Async Fetched data for", this.className, res);

        if (isPromise(res)) {

            let promise = res as Promise<AsyncDataType>;
            this.loading = true;

            this.props.promises.push(
                promise.then((data) => {
                    this.loading = false;
                    this.asyncData = data;

                    console.debug("Async Data arrived for", this.className, data);

                    // Trigger update
                    if (this._isMounted) {
                        this.setState({});
                    }
                }).catch((e) => {
                    this.loading = false;
                    // Trigger update
                    if (this._isMounted) {
                        this.setState({});
                    }
                    this.setState({});
            }));
        } else {
            this.asyncData=res as AsyncDataType;
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
        return <div style={{position:'relative'}} >
            {this.loading && <div style={{position:'absolute', width:"100%", height:5, top:0}} className="animatedStripes" />}
            {this.asyncData ? this.renderLoaded() : null}
        </div>
    }


}
