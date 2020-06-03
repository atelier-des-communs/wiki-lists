import {Record} from "../../shared/model/instances";

export enum DataEventType {
    CREATE= "CREATE",
    UPDATE= "UPDATE"
}

interface IEvent {
        type : DataEventType
}

export class CreateEvent implements IEvent {
    type : DataEventType.CREATE;
    state : Record
}

export class UpdateEvent implements IEvent {
    type : DataEventType.UPDATE;
    previousState : Record;
    state: Record;
}

export type DataEvent = UpdateEvent | CreateEvent;
