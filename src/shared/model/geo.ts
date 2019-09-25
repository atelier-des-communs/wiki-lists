import {Map} from "../utils";

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


const GEOHASH_TILE_WIDTH : Map<number>  = {
    1	:5009000,
    2	:1252000,
    3	:156000,
    4	:39000,
    5	:4900,
    6	:1200,
    7	:152,
    8	:38,
    9	:4.77,
    10	:1.2,
    11	:0.14,
    12	:0.037
};

const ZOOM_TILE_WIDTH : Map<number> = {
    0:	156412,
    1:	78206,
    2:	39103,
    3:	19551,
    4:	9776,
    5:	4888,
    6:	2444,
    7:	1222,
    8:	610,
    9:	305,
    10:	152,
    11:	76,
    12:	38,
    13:	19,
    14:	9,
    15:	4,
    16:	2,
    17:	1,
    18:	0.59,
    19:	0.29,
    20:	0.149,
};

/** Find best precision for a given size og geohash box in pixels */
export function findBestHashPrecision(zoom:number, minSize:number=null, maxSize:number=null) {
    let metersPerPixel = ZOOM_TILE_WIDTH[zoom];
    console.debug("bestHashPrecision : zoom", zoom, "minsize", minSize, "maxsize", maxSize);
    function pixels(precision:number) {
        return GEOHASH_TILE_WIDTH[precision] / metersPerPixel;
    }

    if (minSize) {
        for (let precision = 12; precision >= 1; precision--) {
            let width = pixels(precision);
            if (width >= minSize) {
                console.debug("result : precision", precision, "actualsize", width);
                return precision;
            }
        }
        console.debug("result : default to 1");
        return 1;
    } else {
        for (let precision = 1; precision <= 12; precision++) {
            let width = pixels(precision);
            if (width <= maxSize) {
                console.debug("result : precision", precision, "actualsize", width);
                return precision;
            }
        }
        console.debug("result : default to 12");
        return 12;
    }
}