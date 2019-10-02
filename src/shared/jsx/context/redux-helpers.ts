// Common events mapped to redux store action
import {Record} from "../../model/instances";
import {GlobalContextProps, withGlobalContext} from "./global-context";
import {createItem, deleteItem, updateItem, updateSchema} from "../../../client/rest/client-db";
import {DbPathParams, ReduxEventsProps} from "../common-props";
import {connect, Dispatch} from "react-redux";
import {createAddItemAction, createDeleteAction, createUpdateItemAction, createUpdateSchema} from "../../redux";
import {StructType} from "../../model/types";
import {RouteComponentProps} from "react-router";
import {withAsyncData} from "../async/async-data-component";
import {getDbName} from "../../utils";

/** Expose actions as common props */
export const matchDispatchToProps = (dispatch: Dispatch<{}>, props?: RouteComponentProps<DbPathParams> & GlobalContextProps) : ReduxEventsProps => {

    let name = getDbName(props);

    let onCreate = (record: Record) : Promise<void> => {
        return createItem(name, record).then(function(responseValue) {
            dispatch(createAddItemAction(responseValue));
        })
    };

    let onUpdate = (record: Record) : Promise<void> => {
        return updateItem(name, record).then(function(responseValue) {
            dispatch(createUpdateItemAction(responseValue));
        })
    };

    let onDelete = (id: string) : Promise<void> => {
        return deleteItem(name, id).then(function() {
            dispatch(createDeleteAction(id));
        })
    };

    let onUpdateSchema = (schema: StructType) => {
        return updateSchema(name, schema).then(function(responseValue) {
            dispatch(createUpdateSchema(responseValue));
        })
    };

    return {
        onCreate,
        onUpdate,
        onDelete,
        onUpdateSchema}
};

interface MapStateToPropsFunction<TStateProps, PathParams> {
    (state: any, ownProps?: RouteComponentProps<PathParams> & GlobalContextProps): TStateProps;
}

/**
 * Helper, connecting / injecting :
 * - globalContext,
 * - async data fetching
 * - redux props and events, routes
 */
// @BlackMagic
export function connectComponent<PathParams extends DbPathParams, TStateProps, AsyncProps>(
    stateMapper : MapStateToPropsFunction<TStateProps, PathParams>,
    fetchData : (props:GlobalContextProps & RouteComponentProps<PathParams>) => Promise<AsyncProps> | AsyncProps) {

    type TOwnProps = GlobalContextProps & RouteComponentProps<PathParams> & AsyncProps;
    type TComponentType = TStateProps & GlobalContextProps & RouteComponentProps<PathParams> & ReduxEventsProps & AsyncProps;

    return (component: React.ComponentClass<TComponentType> | React.SFC<TComponentType>) :
        React.ComponentClass<RouteComponentProps<PathParams>> | React.SFC<RouteComponentProps<PathParams>> =>
    {
        let name = (component as any).name
        let withRedux =  connect<TStateProps, ReduxEventsProps, TOwnProps>(stateMapper, matchDispatchToProps)(component);
        return withAsyncData<RouteComponentProps<PathParams>, AsyncProps>(fetchData)(withRedux, name);
    }
}
