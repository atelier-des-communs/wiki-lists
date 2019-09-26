/** */
import * as React from 'react';
import {GlobalContextProps} from "../../context/global-context";
import {DbPathParams, DbProps, PageProps} from "../../common-props";
import {AsyncDataComponent} from "../../async/async-data-component";
import {Cluster, findBestHashPrecision, ICoord} from "../../../model/geo";
import {Record} from "../../../model/instances";
import {Map as MapEl, TileLayer, MapControl, Tooltip, Viewport, CircleMarker} from "react-leaflet";
import {LatLngBounds, LatLng} from "leaflet";
import {arrayToMap, goTo, Map, mapValues, parseParams, updatedParams} from "../../../utils";
import {
    extractFilters,
    extractSearch,
    LocationFilter,
    serializeFilters,
    serializeSortAndFilters
} from "../../../views/filters";
import {Attribute, EnumType, EnumValue, LocationType, Types} from "../../../model/types";
import {encode, bboxes} from "ngeohash";
import * as QueryString from "querystring";
import {DispatchProp} from "react-redux";
import {createUpdateMarkersAction} from "../../../redux";
import {cloneDeep} from "lodash";
import Control from 'react-leaflet-control';
import {Button} from 'semantic-ui-react';
import {isEqual} from "lodash";

type MapProps = GlobalContextProps & DbProps & PageProps<DbPathParams> & DispatchProp<{}>;

const DEFAULT_VIEWPORT : Viewport = {
    center : [46, 2],
    zoom : 6
};

const DEFAULT_BOUNDS = new LatLngBounds(
    new LatLng(42, -5),
    new LatLng(50, 8));

export class RecordsMap extends AsyncDataComponent<MapProps> {

    state : {
        bounds : LatLngBounds,
        markers : (Record | Cluster)[],
        viewport:Viewport};

    locAttr : Attribute;
    colorAttr : Attribute;
    colorMap: Map<EnumValue>;

    constructor(props: MapProps) {
        super(props);
        this.state = {
            markers:null,
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

    fetchData(props: MapProps, nextState:any): Promise<any> {

        console.debug("fetch data called for map");

        // Get location filter from URL
        let query = parseParams(props.location.search);
        let search = extractSearch(query);
        let filters = extractFilters(props.db.schema, query);

        let bounds : LatLngBounds = nextState.bounds;

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
            query["zoom"] = nextState.viewport.zoom;

            let cacheKey = QueryString.stringify(query);

            if (cacheKey in props.store.getState().geoMarkers) {

                console.debug("key in cache, updating", hash);

                let markers = props.store.getState().geoMarkers[cacheKey];

                // Add markers synchronously
                newMarkers = newMarkers.concat(this.filterMarkers(markers, bounds));

            } else {

                console.debug("key not in cache, fetching", hash);

                // Fetch markers for this geohash
                promises.push(props.dataFetcher.getRecordsGeo(
                    props.match.params.db_name,
                    nextState.viewport.zoom,
                    updatedFilters, search,
                    [this.colorAttr.name]).then((markers) =>
                {

                    return {cacheKey, markers};
                }));
            }
        }

        this.state.markers = newMarkers;

        if (promises) {
            return Promise.all(promises).then((items) => {

                let markersByKey : Map<(Cluster | Record)[]> = {};
                for (let keyAndMarkers of items) {
                    markersByKey[keyAndMarkers.cacheKey] = keyAndMarkers.markers;
                    newMarkers = newMarkers.concat(this.filterMarkers( keyAndMarkers.markers, bounds));
                }

                // Store all in cache
                props.store.dispatch(createUpdateMarkersAction(markersByKey));

                // refresh
                this.setState({markers:newMarkers});
            });
        } else {
            return null;
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
        goTo(this.props, serializeFilters([filter]));
    }

    isLocationFilterUpTodate() : boolean {
        // Current map box
        let filter = this.boundsToFilter(this.state.bounds);


        // URL filters
        let query = parseParams(this.props.location.search);
        let filters = extractFilters(this.props.db.schema, query);

        return isEqual(filters[this.locAttr.name], filter);
    }

    renderLoaded() {

        console.debug("Rendering map. Nb markers :", this.state.markers.length);

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
                    center={latln}
                    fillOpacity={1}
                    fillColor={color}
                    strokeColor="black"
                    radius={10} />
            } else {
                let cluster = item as Cluster;
                // Cluster has direct coordinates
                let latln = new LatLng(cluster.lat, cluster.lon);

                return <CircleMarker
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
            if (this.state.markers == null) {
               return null;
            }

            return <>
                {this.state.markers.map((item) => toMarker(item))}
            </>
        };

        return<MapEl

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
    }

}


