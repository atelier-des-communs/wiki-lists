/*
 *  Utils for import a component asynchronously, enabling WebPack to create smaller chunks
 */
import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {AsyncDataComponent} from "./async-data-component";

// Higher order function wrapping a component with async import
export function withAsyncImport<ComponentProps, Void>(
    importComponent: () => Promise<React.ComponentClass<ComponentProps>>)
{

    // This variable holds the component class once loaded : for lazy loading / loading it once
    let Component : React.ComponentClass<ComponentProps>;

    let resClass = class extends AsyncDataComponent<ComponentProps & GlobalContextProps, React.ComponentClass<ComponentProps>> {

        fetchData(nextProps: ComponentProps & GlobalContextProps, nextState: {}) {

            // Already loaded => don't fire promises (useful for SSR prefetching)
            if (Component) return Component;

            return importComponent().then((comp) => {Component = comp; return comp});
        }


        renderLoaded() {
            if (this.asyncData == null) {
                return null;
            } else {
                return <Component {...this.props} />;
            }
        }
    };

    return withGlobalContext(resClass);

}
