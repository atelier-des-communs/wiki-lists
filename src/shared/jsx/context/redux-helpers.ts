// Common events mapped to redux store action
import {Record} from "../../model/instances";
import {GlobalContextProps, withGlobalContext} from "./global-context";
import {createItem, deleteItem, updateItem, updateSchema} from "../../rest/client";
import {ReduxEventsProps} from "../common-props";
import {Dispatch, connect} from "react-redux";
import {createAddItemAction, createDeleteAction, createUpdateItemAction, createUpdateSchema} from "../../redux";
import {StructType} from "../../model/types";
import {RouteComponentProps, withRouter} from "react-router";

const matchDispatchToProps = (dispatch: Dispatch<{}>, props?: RouteComponentProps<any> & GlobalContextProps) : ReduxEventsProps => {

    let onCreate = (record: Record) : Promise<void> => {
        return createItem(props.dbName, record).then(function(responseValue) {
            dispatch(createAddItemAction(responseValue));
        })
    };

    let onUpdate = (record: Record) : Promise<void> => {
        return updateItem(props.dbName, record).then(function(responseValue) {
            dispatch(createUpdateItemAction(responseValue));
        })
    };

    let onDelete = (id: string) : Promise<void> => {
        return deleteItem(props.dbName, id).then(function() {
            dispatch(createDeleteAction(id));
        })
    };

    let onUpdateSchema = (schema: StructType) => {
        return updateSchema(props.dbName, schema).then(function(responseValue) {
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

/** Helper, connecting / injecting : globalContext, redux props and events, routes */
// @BlackMagic
export function connectPage<PathParams, TStateProps>(stateMapper : MapStateToPropsFunction<TStateProps, PathParams>) {
    type TComponentType = TStateProps & GlobalContextProps & RouteComponentProps<PathParams> & ReduxEventsProps;
    return (component: React.ComponentClass<TComponentType> | React.SFC<TComponentType>) : React.ComponentClass<RouteComponentProps<PathParams>> | React.SFC<RouteComponentProps<PathParams>> => {
        let withRedux =  connect(stateMapper, matchDispatchToProps)(component);
        return withGlobalContext(withRedux);
    }
}
