/*
* Some common
*/
import {StructType} from "../model/types";
import {Record} from "../model/instances";

/** Props injected by react-redux (the state) */
export interface ReduxProps {
    schema : StructType;
    records: Record[]}


/** Event handler props injected by react redux */
export interface CollectionEventProps {
    onUpdateSchema : (schema:StructType) => void,
    onUpdate: (newValue : Record) => void,
    onCreate: (newValue : Record) => void,
    onDelete: (id : string) => void}