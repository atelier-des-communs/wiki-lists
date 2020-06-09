/** */
import * as React from 'react';
import {GlobalContextProps} from "../../context/global-context";
import {DbPathParams, DbProps, PageProps} from "../../common-props";
import {AsyncDataComponent} from "../../async/async-data-component";
import {ApproxCluster, Cluster, ICoord} from "../../../model/geo";
import {Record} from "../../../model/instances";
import {CircleMarker, Map as MapEl, TileLayer, Tooltip, Viewport} from "react-leaflet";
import {CRS, LatLng, LatLngBounds, Point} from "leaflet";
import {
    arrayToMap,
    closeTo,
    getDbName,
    goTo,
    goToResettingPage,
    humanReadableCount,
    Map,
    parseBool,
    parseParams
} from "../../../utils";
import {
    extractFilters,
    extractSearch,
    LocationFilter,
    serializeFilters,
    serializeSortAndFilters
} from "../../../views/filters";
import {Attribute, EnumType, EnumValue, Types} from "../../../model/types";
import {createUpdateMarkersAction} from "../../../redux";
import {cloneDeep, isEqual} from "lodash";
import Control from 'react-leaflet-control';
import {Button, Label} from 'semantic-ui-react';
import {Marker} from "../../../api";
import stringify from "json-stringify-deterministic";
import {RecordPopup} from "../../components/record-popup";
import * as tilebelt from "tilebelt";

type MapProps = GlobalContextProps & DbProps & PageProps<DbPathParams>;

const DEFAULT_VIEWPORT : Viewport = {
    center : [46, 2],
    zoom : 6
};

const DEFAULT_BOUNDS = new LatLngBounds(
    new LatLng(42, -5),
    new LatLng(50, 8));

// FIXME hardcoded
const SIZE_ATTR = "superficie_locaux";
const SIZE_MIN_VAL = 100;
const SIZE_MAX_VAL = 20000;
const MAX_RADIUS=30;
const MIN_RADIUS=5;


let BOUND_PX_EXTENT = 1000;

type IState = {
    popupRecordId:string,
    viewport:Viewport};


const ZOOM_QUERY_KEY = "map.z";
const CENTER_QUERY_KEY = "map.c";
const FROM_MAP_KEY = "map.f";


function sameViewport(vp1:Viewport, vp2:Viewport) {
    return vp1.zoom == vp2.zoom
        && closeTo(vp1.center[0], vp2.center[0])
        && closeTo(vp1.center[1], vp2.center[1])
}

// Transform view port to URL query params
export function viewPortToQuery(viewport : Viewport, fromMap: number=0) : Map<any> {
    // Default view port ?
    if (sameViewport(viewport, DEFAULT_VIEWPORT)) {
        return {
            [ZOOM_QUERY_KEY] : null,
            [CENTER_QUERY_KEY] : null,
        }
    } else {
        let tile = tilebelt.pointToTile(
            viewport.center[1],
            viewport.center[0],
            23);
        return {
            [ZOOM_QUERY_KEY]: viewport.zoom,
            [CENTER_QUERY_KEY] : tilebelt.tileToQuadkey(tile),
            [FROM_MAP_KEY] : fromMap, // Usefull to prevent infinite loop of viewport updates due to rounding errors
        }
    }
}

function queryToViewport(query : Map<any>) : Viewport {
    if (!(CENTER_QUERY_KEY in query)) {
        return DEFAULT_VIEWPORT;
    } else {
        let bbox = tilebelt.tileToBBOX(tilebelt.quadkeyToTile(query[CENTER_QUERY_KEY]));
        return {
            center: [bbox[1], bbox[0]],
            zoom: parseInt(query[ZOOM_QUERY_KEY])
        }
    }
}

export class RecordsMap extends AsyncDataComponent<MapProps, Marker[]> {

    className = "RecordsMap";

    state : IState;

    locAttr : Attribute;
    colorAttr : Attribute;
    colorMap: Map<EnumValue>;

    constructor(props: MapProps) {
        super(props);

        // Open directly from URL
        let params = parseParams(this.props.location.search);


        this.state = {
            popupRecordId: params.popup || null,
            viewport:queryToViewport(parseParams(props.location.search))};

        // Get the location attribute
        let locationAttrs = props.db.schema.attributes.filter(attr => attr.type.tag == Types.LOCATION);
        this.locAttr = locationAttrs[0];

        // FIXME: hardcoded
        this.colorAttr = props.db.schema.attributes.filter(attr => attr.name == "type")[0];
        this.colorMap = arrayToMap((this.colorAttr.type as EnumType).values, (enumVal) => enumVal.value);

        console.debug("Color map", this.colorMap);
    }

    static viewportToBounds(viewport: Viewport) : LatLngBounds {
        // WGS 84
        let crs = CRS.EPSG4326;
        let center = new LatLng(viewport.center[0], viewport.center[1]);
        let centerPoint = crs.latLngToPoint(center, viewport.zoom);
        console.debug("center point", center, centerPoint);
        let minPt  = new Point(centerPoint.x - BOUND_PX_EXTENT, centerPoint.y - BOUND_PX_EXTENT);
        let maxPt  = new Point(centerPoint.x + BOUND_PX_EXTENT, centerPoint.y + BOUND_PX_EXTENT);
        return new LatLngBounds(
            crs.pointToLatLng(minPt, viewport.zoom),
            crs.pointToLatLng(maxPt, viewport.zoom));
    }

    // List geo hashes for covering area with specifc zoom
    listHashes(bound : LatLngBounds, zoom:number) {

        // Compute best precision to fetch a few tiles
        let hashsize = Math.max(1, zoom - 2);

        // FIXME trouble at greenwich ??
        let mintile = tilebelt.pointToTile(
            bound.getWest(),
            bound.getNorth(),
            hashsize);

        let maxtile = tilebelt.pointToTile(
            bound.getEast(),
            bound.getSouth(),
            hashsize);

        console.debug("bbox", bound, "hashsize", hashsize, "min tile", mintile, "max tile", maxtile);

        let res : string[] = [];
        for (let x=mintile[0]; x <= maxtile[0]; x++) {
            for (let y=mintile[1]; y <= maxtile[1]; y++) {
                res.push(tilebelt.tileToQuadkey([x, y, hashsize]));
            }
        }
        return res;
    }

    openPopup(recordId:string) {
        this.setState({popupRecordId:recordId});
    }
    closePopup() {
        this.setState({popupRecordId:null});
    }

    // Update map center and zoom from upfront change of URL
    componentWillReceiveProps(nextProps: Readonly<MapProps>, nextContext: any): void {
        let nextParams = parseParams(nextProps.location.search);
        if (parseBool(nextParams[FROM_MAP_KEY])) {
            return;
        }

        let currViewport = queryToViewport(parseParams(this.props.location.search));
        let nextViewport = queryToViewport(nextParams);
        console.debug("viewports", currViewport, nextViewport, this.state.viewport);
        if (!sameViewport(currViewport, nextViewport) && !sameViewport(this.state.viewport, nextViewport)) {
            this.setState({viewport:nextViewport});
        }
    }

    viewportToFilter(viewport:Viewport) {
        let bounds = RecordsMap.viewportToBounds(viewport);
        let locFilter = new LocationFilter(this.locAttr);
        locFilter.minlon = bounds.getWest();
        locFilter.maxlon = bounds.getEast();
        locFilter.minlat = bounds.getSouth();
        locFilter.maxlat = bounds.getNorth();
        return locFilter;
    }

    filterMarkers(markers : (Cluster|Record)[], bounds:LatLngBounds): (Cluster|Record)[] {
        return markers.filter(marker => {
            if (marker.hasOwnProperty("approx")) {
                // Cluster of approximate locations
                return true;
            }
            let coord : ICoord = marker.hasOwnProperty("_id") ?
                (marker as Record)[this.locAttr.name] as ICoord
                : marker as Cluster;
            return bounds.contains(new LatLng(coord.lat, coord.lon));
        });
    }



    fetchData(props: MapProps, nextState:IState): Promise<Marker[]>|Marker[] {

        // console.debug("fetch data called for map");

        // Get location filter from URL
        let query = parseParams(props.location.search);
        let search = extractSearch(query);
        let filters = extractFilters(props.db.schema, query);

        let bounds : LatLngBounds = RecordsMap.viewportToBounds(nextState.viewport);

        // console.debug("Geo bounds", bounds, "zoom", nextState.viewport.zoom);

        // List geohashes to request
        // We use geohashes in order to "tile" the request and to make theam easier to cache both on client & server
        let hashes = this.listHashes(bounds, nextState.viewport.zoom);

        console.debug("Required hashes", hashes);


        let filtersForHash = (hash: string) => {
            let res = cloneDeep(filters);

            // Geohash filter
            let locFilter = new LocationFilter(this.locAttr, {[this.locAttr.name] : hash});

            res[this.locAttr.name] = locFilter;
            return res;
        };

        let promises : Promise<{cacheKey:string, markers:(Cluster|Record)[]}>[] = [];

        // Key in cache
        let newMarkers : (Record | Cluster)[] = [];

        for (let hash of hashes) {

            // Compute key of cache
            let updatedFilters = filtersForHash(hash);
            let query = serializeSortAndFilters(null, updatedFilters, search);

            // Add zoom to the key
            query["zoom"] = nextState.viewport.zoom;

            let cacheKey = stringify(query);

            if (cacheKey in props.store.getState().geoMarkers) {

                // console.debug("key in cache", hash, cacheKey);
                let markers = props.store.getState().geoMarkers[cacheKey];

                // Add markers synchronously
                newMarkers = newMarkers.concat(this.filterMarkers(markers, bounds));

            } else {

                console.debug("key not in cache, fetching", hash, cacheKey);

                // Fetch markers for this geohash
                // XXX Suze
                promises.push(props.dataFetcher.getRecordsGeo(
                    getDbName(props),
                    nextState.viewport.zoom,
                    updatedFilters, search,
                    [this.colorAttr.name, SIZE_ATTR]).then((markers) =>
                {
                    return {cacheKey, markers};
                }));
            }
        }


        if (promises.length > 0) {

            // Wait for all tiles
            return Promise.all(promises).then((items) => {

                let markersByKey : Map<(Cluster | Record)[]> = {};
                for (let keyAndMarkers of items) {

                    // For cache
                    markersByKey[keyAndMarkers.cacheKey] = keyAndMarkers.markers;

                    // Append to result
                    newMarkers = newMarkers.concat(keyAndMarkers.markers);
                }

                // Store all in cache
                props.store.dispatch(createUpdateMarkersAction(markersByKey));
                let res = this.filterMarkers(newMarkers, bounds);
                // console.debug("Asynchronous update of markers", res);
                return res;
            });
        } else {

            // Synchronous render
            let res = this.filterMarkers(newMarkers, bounds);
            // console.debug("Synchronous update of markers", res);
            return res;
        }
    }

    onViewportChanged = (viewport: Viewport) => {
        this.setState({viewport});
        goTo(this.props, viewPortToQuery(viewport, 1));
    };

    zoomOn(coord :ICoord) {
        let viewport : Viewport = {
            zoom : this.state.viewport.zoom +2,
            center : [coord.lat, coord.lon]
        };
        this.setState({viewport});
    };

    updateFilters = () => {
        let filter = this.viewportToFilter(this.state.viewport);
        goToResettingPage(this.props, serializeFilters([filter]));
    };

    isLocationFilterUpTodate() : boolean {

        // Current map box
        let filter = this.viewportToFilter(this.state.viewport);

        // URL filters
        let query = parseParams(this.props.location.search);
        let filters = extractFilters(this.props.db.schema, query);

        return isEqual(filters[this.locAttr.name], filter);
    }

    resetViewPort = () => {
        this.onViewportChanged(DEFAULT_VIEWPORT);
    };

    renderLoaded() {

        let _ = this.props.messages;

        let toMarker = (item : Marker) => {
            if (item.hasOwnProperty("_id")) {

                // Record ? => get its location attribute
                let record = (item as Record);
                let coord = record[this.locAttr.name] as ICoord;
                let latln =  new LatLng(coord.lat, coord.lon);

                let colorVal = record[this.colorAttr.name];
                let color = colorVal ? this.colorMap[colorVal].color : "white";

                // Compute size
                let sizeVal = record[SIZE_ATTR] || SIZE_MIN_VAL;
                if (sizeVal < SIZE_MIN_VAL) sizeVal = SIZE_MIN_VAL;
                if (sizeVal > SIZE_MAX_VAL) sizeVal = SIZE_MAX_VAL;
                let radius = MIN_RADIUS + (sizeVal - SIZE_MIN_VAL) / (SIZE_MAX_VAL - SIZE_MIN_VAL) * (MAX_RADIUS - MIN_RADIUS);


                return <CircleMarker
                    key={record._id}
                    center={latln}
                    onClick={() => this.openPopup((item as Record)._id)}
                    fillOpacity={0.7}
                    fillColor={color}
                    color="black"
                    weight={1}
                    radius={radius} />
            } else if ((item as ApproxCluster).approx) {
                // Approx cluster, do not display as marker
                return null
            } else {
                let cluster = item as Cluster;

                // Cluster has direct coordinates
                let latln = new LatLng(cluster.lat, cluster.lon);

                return <CircleMarker
                    key={latln.toString()}
                    center={latln}
                    radius={25}
                    weight={10}
                    color="#dfd512"
                    opacity={0.3}
                    fillColor="#dfd512"
                    fillOpacity={0.8}
                    onClick={() => this.zoomOn(cluster)} >
                    <Tooltip permanent direction="center" className="count-tooltip" >
                        {humanReadableCount(cluster.count)}
                    </Tooltip>
                </CircleMarker>
            }
        };

        // Find possible "approx" clusters
        let approxNumber = !this.asyncData ? 0 : this.asyncData
            .filter(marker => (marker as ApproxCluster).approx)
            .reduce((sum, marker : ApproxCluster) => sum + marker.count, 0);

        const Markers = () => {
            if (this.asyncData == null) {
               return null;
            }

            return <>
                {this.asyncData.map((item) => toMarker(item))}
            </>
        };

        return <><MapEl
            id="map"
            viewport={this.state.viewport}
            onViewportChanged={this.onViewportChanged}
            style={{height:'500px', width:'100%'}} scrollWheelZoom={false}
            ref="map">

            <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {this.isLocationFilterUpTodate() ? null :
                <Control position="bottomleft" >
                    <Button
                        icon="filter"
                        onClick={this.updateFilters}
                        primary
                        content={_.update_list_from_map}
                        size="small" compact />
                </Control>}

            {
                approxNumber > 0 &&
                <Control position="bottomleft" >
                    <Label content={`+ ${approxNumber} non géolocalisés`}/>
                </Control>
            }

            <Control position="topleft" >
                <Button icon="home"
                        onClick={this.resetViewPort}
                        size="small" compact >
                </Button>
            </Control>

            <Markers />

        </MapEl>
            {this.state.popupRecordId ?
                <RecordPopup
                    {...this.props}
                    recordId={this.state.popupRecordId}
                    onClose={() => this.closePopup()}
                    large={true}
                /> : null}
            </>
    }

}


