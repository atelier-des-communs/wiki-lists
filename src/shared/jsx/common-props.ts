/*
* Some common props for components
*/
import {StructType} from "../model/types";
import {Record} from "../model/instances";
import {GlobalContextProps} from "./context/global-context";
import {RouteComponentProps} from "react-router";
import {AccessRight} from "../access";


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


/** Props for components acting on a specific DB */
export interface DbProps {
    schema : StructType;
    rights: AccessRight[];
}

/** Props for components displaying a list of records */
export interface RecordsProps extends DbProps{
    records: Record[]}

export interface SingleRecordProps extends DbProps {
    record: Record,
    large?:boolean}

/** Event handler props injected by react redux */
export interface ReduxEventsProps {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>}