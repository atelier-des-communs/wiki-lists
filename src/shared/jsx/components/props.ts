/*
* Some common props for components
*/
import {Attribute, StructType} from "../../model/types";
import {Record} from "../../model/instances";

export interface CollectionRouteProps {
    db_name :string;
}

export interface SingleRecordRouteProps extends CollectionRouteProps {
    id :string;
}


/** Props for components displaying a list of records */
export interface RecordProps {
    schema : StructType;
    records: Record[]}


/** Event handler props injected by react redux */
export interface CollectionEventProps {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>}