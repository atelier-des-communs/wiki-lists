/*
 * Abstract component that requires async data
 * The promises it fires are stored in the global context enabling SSR to wait of
 * all of them to resolve and re-rendering.
 */
import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Loader, Dimmer} from "semantic-ui-react";

export abstract class AsyncDataComponent<T extends GlobalContextProps> extends React.Component<T> {

    state : {loading:boolean};

    constructor(props: T) {
        super(props);
        this.state = {loading:false};
    }

    /** Should look at props / state, and return null if no loading is required */
    abstract fetchData() :  Promise<{}>;

    componentWillMount() {
        let promise  = this.fetchData();
        if (promise) {

            this.setState({loading:true});

            this.props.promises.push(
                promise.then(() => {
                    this.setState({loading:false});
                }));
        }
    }

    render() {
        let child = this.renderLoaded();
        return <div>
                <Dimmer active={this.state.loading}>
                   <Loader />
                </Dimmer>
                {child}
            </div>
    }

    abstract renderLoaded(): false | JSX.Element;
}


// Higher order function wrapping a component with async data fetching
export function withAsyncData<P>(
    fetchData:(props: Readonly<P & GlobalContextProps>) => Promise<any>)
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
