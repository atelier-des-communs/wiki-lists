/*
* Some common
*/
import {Attribute, StructType} from "../model/types";
import {Record} from "../model/instances";

/** Props injected by react-redux (the state) */
export interface ReduxProps {
    schema : StructType;
    records: Record[]}


/** Event handler props injected by react redux */
export interface CollectionEventProps {
    onUpdateSchema : (schema : StructType) => Promise<void>,
    onUpdate: (newValue : Record) => Promise<void>,
    onCreate: (newValue : Record) => Promise<void>,
    onDelete: (id : string) => Promise<void>}