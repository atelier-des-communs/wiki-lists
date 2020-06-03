/*
* Some common props for components
*/
import * as React from "react";
import {StructType} from "../model/types";
import {Record} from "../model/instances";
import {GlobalContextProps} from "./context/global-context";
import {RouteComponentProps} from "react-router";
import {DbDefinition} from "../model/db-def";
import {getDbName} from "../utils";
import {createItem, deleteItem, updateItem, updateSchema} from "../../client/rest/client-db";
import {createAddItemAction, createDeleteAction, createUpdateItemAction, createUpdateSchema} from "../redux";


/** Custom route path params parsed for the "records" page */
export interface DbPathParams {
    db_name :string;
}

/** Custom route path params parsed for the SingleRecord page */
export interface SingleRecordPathParams extends DbPathParams {
    id :string;
}

/** Generic params for any root page : GlobalContext + Route properties */
export type PageProps<RouteProps> = GlobalContextProps & RouteComponentProps<RouteProps>

/** Props for components acting on a specific DB */
export interface DbProps {
    db: DbDefinition;
}

export interface RecordsProps {
    records : Record[];
}

export interface SingleRecordPropsOnly {record: Record}

export type SingleRecordProps = SingleRecordPropsOnly & DbProps;

export interface UpdateActions {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>};

export class UpdateActionsImpl implements UpdateActions {

    props :  GlobalContextProps & RouteComponentProps<DbPathParams>;

    constructor(props: GlobalContextProps & RouteComponentProps<DbPathParams>) {
        this.props = props;
    }

    onCreate = (record: Record) : Promise<void> => {
        let dispatch = this.props.store.dispatch;
        let dbname = getDbName(this.props);

        return createItem(dbname, record).then(function(responseValue) {
            dispatch(createAddItemAction(responseValue));
        })
    };

    onUpdate = (record: Record) : Promise<void> => {
        let dispatch = this.props.store.dispatch;
        let dbname = getDbName(this.props);
        return updateItem(dbname, record).then(function(responseValue) {
            dispatch(createUpdateItemAction(responseValue));
        })
    }

    onDelete = (id: string) : Promise<void> => {
        let dispatch = this.props.store.dispatch;
        let dbname = getDbName(this.props);
        return deleteItem(dbname, id).then(function() {
            dispatch(createDeleteAction(id));
        })
    }

    onUpdateSchema = (schema: StructType) => {
        let dispatch = this.props.store.dispatch;
        let dbname = getDbName(this.props);
        return updateSchema(dbname, schema).then(function(responseValue) {
            dispatch(createUpdateSchema(responseValue));
        })
    };
}

