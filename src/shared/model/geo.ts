
export interface ICoord  {
    lat:number,
    lon:number;
}

export interface Marker extends ICoord {
    id: string;
    size: number;
    color: string;
}


export interface Cluster extends ICoord {
    count:number;
}

export type MarkerOrCluster = Marker | Cluster;