/*
* Some common props for components
*/
import {Attribute, StructType} from "../../model/types";
import {Record} from "../../model/instances";
import {GlobalContextProps} from "../context/context";

/** Route props : specify the params to be found in url */
export interface RecordsRouteProps {
    db_name :string;
}

export interface SingleRecordRouteProps extends RecordsRouteProps {
    id :string;
}


/** Props for components displaying a list of records */
export interface RecordsProps {
    schema : StructType;
    records: Record[]};

export interface RecordProps {
    schema : StructType;
    record: Record}

/** Event handler props injected by react redux */
export interface CollectionEventProps {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>}