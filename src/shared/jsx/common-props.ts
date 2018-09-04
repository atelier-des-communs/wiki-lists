/*
* Some common props for components
*/
import {Attribute, StructType} from "../model/types";
import {Record} from "../model/instances";
import {GlobalContextProps} from "./context/global-context";
import {RouteComponentProps} from "react-router";


/** Custom route path params parsed for the "records" page */
export interface DbPathParams {
    db_name :string;
}

/** Custom route path params parsed for the SingleRecord page */
export interface SingleRecordPathParams extends DbPathParams {
    id :string;
}

/** Properties common to all DB pages */
export type DbPageProps = RouteComponentProps<DbPathParams> & GlobalContextProps;


/** Props for components displaying a list of records */
export interface RecordsProps {
    schema : StructType;
    records: Record[]};

export interface SingleRecordProps {
    schema : StructType;
    record: Record,
    large?:boolean;}

/** Event handler props injected by react redux */
export interface ReduxEventsProps {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>}