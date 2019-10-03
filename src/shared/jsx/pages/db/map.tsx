/** */
import * as React from 'react';
import {GlobalContextProps} from "../../context/global-context";
import {DbPathParams, DbProps, PageProps} from "../../common-props";
import {AsyncDataComponent} from "../../async/async-data-component";
import {Cluster, findBestHashPrecision, ICoord} from "../../../model/geo";
import {Record} from "../../../model/instances";
import {CircleMarker, Map as MapEl, TileLayer, Tooltip, Viewport} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {arrayToMap, getDbName, goToResettingPage, Map, parseParams} from "../../../utils";
import {
    extractFilters,
    extractSearch,
    LocationFilter,
    serializeFilters,
    serializeSortAndFilters
} from "../../../views/filters";
import {Attribute, EnumType, EnumValue, Types} from "../../../model/types";
import {bboxes} from "ngeohash";
import {DispatchProp} from "react-redux";
import {createUpdateMarkersAction} from "../../../redux";
import {cloneDeep, isEqual} from "lodash";
import Control from 'react-leaflet-control';
import {Button} from 'semantic-ui-react';
import {Marker} from "../../../api";
import stringify from "json-stringify-deterministic";
import {RecordPopup} from "../../components/record-popup";
import {getDbDef} from "../../../../server/db/db";


type MapProps = GlobalContextProps & DbProps & PageProps<DbPathParams> & DispatchProp<{}>;

const DEFAULT_VIEWPORT : Viewport = {
    center : [46, 2],
    zoom : 6
};

const DEFAULT_BOUNDS = new LatLngBounds(
    new LatLng(42, -5),
    new LatLng(50, 8));

export class RecordsMap extends AsyncDataComponent<MapProps, Marker[]> {

    className = "RecordsMap";

    state : {
        popupRecordId:string,
        bounds : LatLngBounds,
        viewport:Viewport};

    locAttr : Attribute;
    colorAttr : Attribute;
    colorMap: Map<EnumValue>;

    constructor(props: MapProps) {
        super(props);
        this.state = {
            popupRecordId:null,
            bounds : DEFAULT_BOUNDS,
            viewport:DEFAULT_VIEWPORT}

        // Get the location attribute
        let locationAttrs = props.db.schema.attributes.filter(attr => attr.type.tag == Types.LOCATION);
        this.locAttr = locationAttrs[0];

        // FIXME: hardcoded
        this.colorAttr = props.db.schema.attributes.filter(attr => attr.name == "type")[0];
        this.colorMap = arrayToMap((this.colorAttr.type as EnumType).values, (enumVal) => enumVal.value)

        console.debug("Color map", this.colorMap);
    }

    // List geo hashes for covering area with specifc zoom
    listHashes(bound : LatLngBounds, zoom:number) {

        // Compute best precision to fetch a few tiles
        let hashsize = findBestHashPrecision(zoom, 500);
        console.debug("zoom", zoom, "hashsize", hashsize);

        return bboxes(
            bound.getSouth(), bound.getWest(),
            bound.getNorth(), bound.getEast() ,
            hashsize);
    }

    openPopup(recordId:string) {
        this.setState({popupRecordId:recordId});
    }
    closePopup() {
        this.setState({popupRecordId:null});
    }

    boundsToFilter(bounds:LatLngBounds) {
        let locFilter = new LocationFilter(this.locAttr);
        locFilter.minlon = bounds.getWest();
        locFilter.maxlon = bounds.getEast();
        locFilter.minlat = bounds.getSouth();
        locFilter.maxlat = bounds.getNorth();
        return locFilter;
    }

    filterMarkers(markers : (Cluster|Record)[], bounds:LatLngBounds): (Cluster|Record)[] {
        return markers.filter(marker => {
            let coord : ICoord = marker.hasOwnProperty("_id") ?
                (marker as Record)[this.locAttr.name] as ICoord
                : marker as Cluster;
            return bounds.contains(new LatLng(coord.lat, coord.lon));
        });
    }

    fetchData(props: MapProps, nextState:any): Promise<Marker[]>|Marker[] {

        // console.debug("fetch data called for map");

        // Get location filter from URL
        let query = parseParams(props.location.search);
        let search = extractSearch(query);
        let filters = extractFilters(props.db.schema, query);

        let bounds : LatLngBounds = nextState.bounds;

        // console.debug("Geo bounds", bounds, "zoom", nextState.viewport.zoom);

        // List geohashes to request
        // We use geohashes in order to "tile" the request and to make theam easier to cache both on client & server
        let hashes = this.listHashes(bounds, nextState.viewport.zoom);

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
                promises.push(props.dataFetcher.getRecordsGeo(
                    getDbName(props),
                    nextState.viewport.zoom,
                    updatedFilters, search,
                    [this.colorAttr.name]).then((markers) =>
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

        let bounds = (this.refs.map as any).leafletElement.getBounds();
        this.setState({viewport, bounds});

        // Update URL with geo filter
        // goTo(this.props, serializeFilters([filter]));
    };

    zoomOn(coord :ICoord) {
        let viewport : Viewport = {
            zoom : this.state.viewport.zoom +2,
            center : [coord.lat, coord.lon]
        }
        this.setState({viewport});
    };

    updateFilters = () => {
        let filter = this.boundsToFilter(this.state.bounds);
        goToResettingPage(this.props, serializeFilters([filter]));
    }

    isLocationFilterUpTodate() : boolean {
        // Current map box
        let filter = this.boundsToFilter(this.state.bounds);


        // URL filters
        let query = parseParams(this.props.location.search);
        let filters = extractFilters(this.props.db.schema, query);

        return isEqual(filters[this.locAttr.name], filter);
    }

    render() {

        console.debug("Rendering map");

        let _ = this.props.messages;


        let toMarker = (item : Record | Cluster) => {
            if (item.hasOwnProperty("_id")) {
                // Record ? => get its location attribute
                let record = (item as Record);
                let coord = record[this.locAttr.name] as ICoord;
                let latln =  new LatLng(coord.lat, coord.lon);

                let colorVal = record[this.colorAttr.name]
                let color = colorVal ? this.colorMap[colorVal].color : "white";

                return <CircleMarker
                    key={record._id}
                    center={latln}
                    onClick={() => this.openPopup((item as Record)._id)}
                    fillOpacity={1}
                    fillColor={color}
                    color="black"
                    weight={2}
                    radius={10} />
            } else {
                let cluster = item as Cluster;
                // Cluster has direct coordinates
                let latln = new LatLng(cluster.lat, cluster.lon);

                return <CircleMarker
                    key={latln.toString()}
                    center={latln}
                    radius={30}
                    stroke={false}
                    fillColor="#dfd512"
                    fillOpacity={1}
                    onClick={() => this.zoomOn(cluster)} >
                    <Tooltip permanent direction="center" className="count-tooltip" >
                        {cluster.count}
                    </Tooltip>
                </CircleMarker>
            }
        };

        const Markers = () => {
            if (this.asyncData == null) {
               return null;
            }

            return <>
                {this.asyncData.map((item) => toMarker(item))}
            </>
        };

        return <><MapEl

            viewport={this.state.viewport}
            onViewportChanged={this.onViewportChanged}
            style={{height:'500px', width:'100%'}} scrollWheelZoom={false}
            ref="map">

            <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {this.isLocationFilterUpTodate() ? null : <Control position="bottomleft" >
                <Button icon="filter" onClick={this.updateFilters}>
                    {_.update_list_from_map}
                </Button>
            </Control>}

            <Markers />

        </MapEl>
            {this.state.popupRecordId ?
                <RecordPopup
                    {...this.props}
                    recordId={this.state.popupRecordId}
                    onClose={() => this.closePopup()}
                /> : null}
            </>
    }

}


