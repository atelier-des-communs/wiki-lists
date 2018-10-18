/*
* Some common props for components
*/
import {StructType} from "../model/types";
import {Record} from "../model/instances";
import {GlobalContextProps} from "./context/global-context";
import {RouteComponentProps} from "react-router";
import {AccessRight} from "../access";
import {DbDefinition} from "../../server/db/db";


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
export interface DbProps extends DbDefinition {

}

/** Props for components displaying a list of records */

export interface RecordsPropsOnly {
    records: Record[]};
export type RecordsProps = RecordsPropsOnly & DbProps;

export interface SingleRecordPropsOnly {
    record: Record,
    large?:boolean}
export type SingleRecordProps = SingleRecordPropsOnly & DbProps;

/** Event handler props injected by react redux */
export interface ReduxEventsProps {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>}