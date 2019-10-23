import {Map} from "../utils";

export interface ICoord  {
    lat:number,
    lon:number;
}



export interface Cluster extends ICoord {
    count:number;
}
export class ApproxCluster {
    approx = true;
    count:number;
}

