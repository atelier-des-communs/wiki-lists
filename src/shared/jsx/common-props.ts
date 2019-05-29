/*
* Some common props for components
*/
import * as React from "react";
import {StructType} from "../model/types";
import {Record} from "../model/instances";
import {GlobalContextProps} from "./context/global-context";
import {RouteComponentProps} from "react-router";
import {DbDefinition} from "../model/db-def";


/** Custom route path params parsed for the "records" page */
export interface DbPathParams {
    db_name :string;
}

/** Custom route path params parsed for the SingleRecord page */
export interface SingleRecordPathParams extends DbPathParams {
    id :string;
}

/** Root page props */
export type PageProps<RouteProps> = GlobalContextProps & RouteComponentProps<RouteProps>

export class PageComponent<RouteProps> extends React.Component<PageProps<RouteProps>> {

}

export type PageSFC<RouteProps> = React.SFC<PageProps<RouteProps>>;


/** Props for components acting on a specific DB */
export interface DbProps {
    db: DbDefinition;
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