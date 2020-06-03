import * as React from "react";
import {Button, Checkbox, Divider, Grid, Header, Icon, Modal, Input, Popup, Segment, Search, SearchResultProps} from "semantic-ui-react";
import {
    BooleanFilter,
    clearFiltersOrSearch,
    EnumFilter,
    extractFilters,
    extractSearch,
    Filter,
    hasFiltersOrSearch,
    NumberFilter,
    serializeFilter,
    serializeSearch,
    TextFilter
} from "../../views/filters";
import {RouteComponentProps, withRouter} from "react-router";
import {Attribute, StructType, TextType, Types} from "../../model/types";
import {
    copyArr, empty,
    getDbName,
    goTo,
    goToResettingPage,
    isIn, Map,
    parseParams,
    remove,
    stopPropag,
    strToInt
} from "../../utils";
import * as debounce from "debounce";
import {ButtonWrapper, SafePopup} from "../utils/ssr-safe";
import {attrLabel, ellipsis} from "../utils/utils";
import {ValueHandler} from "./editors";
import {MessagesProps} from "../../i18n/messages";
import {ResponsiveButton} from "../components/responsive";
import {DbPageProps} from "../pages/db/db-page-switch";
import {Autocomplete} from "../../api";
import {viewPortToQuery} from "../pages/db/map";
import {GlobalContextProps} from "../context/global-context";
import {isEqual} from "lodash";


const DEBOUNCE_DELAY= 500;
const CITY_ZOOM = 14;



// Main siwtch on attribute type
interface SingleFilterProps<T> extends DbPageProps  {
    // FIXME : extraUrlParams used only for geo records, for cemntering the map ... bad design
    updateFilter : (newFilter:T, extraUrlParams?:Map<String>) => void;
    attr: Attribute;
    filter: T;
}

abstract class AbstractSingleFilter<T extends Filter, U={}> extends React.Component<SingleFilterProps<T> & U> {
}

class BooleanFilterComponent extends AbstractSingleFilter<BooleanFilter> {

    render() {
        let filter = this.props.filter;
        let _ = this.props.messages;

        return <>
            <Checkbox
                label={_.yes}
                checked={filter.showTrue}
                onClick={() => {
                    let newFilter = Object.create(filter);
                    newFilter.showTrue = ! filter.showTrue;
                    this.props.updateFilter(newFilter);
                }} />
           &nbsp;
            <Checkbox
                label={_.no}
                checked={filter.showFalse}
                onClick={() => {
                    let newFilter =  Object.create(filter);
                    newFilter.showFalse = ! filter.showFalse;
                    this.props.updateFilter(newFilter);
                }} />
            <br/>
        </>
    }
}

interface TextFilterExtraProps {
    geofilter ?: boolean;
}
export class TextFilterComponent extends AbstractSingleFilter<TextFilter, TextFilterExtraProps> {

    state : {
        loading : boolean;
        value : string;
        results : SearchResultProps[] }

    constructor(props: SingleFilterProps<TextFilter>) {
        super(props);
        this.state = {
            loading:false,
            value:props.filter.search || "",
            results:[]}
    }

    componentWillReceiveProps(nextProps: Readonly<SingleFilterProps<TextFilter>>, nextContext: any): void {
        if (nextProps.filter.search != this.props.filter.search
            && nextProps.filter.search != this.state.value) {
            this.setState({value:nextProps.filter.search || ""})
        }
    }

    updateFilter(value:string, exact:boolean=false, extraQuery:Map<string>=null) {
        let newFilter : TextFilter = Object.create(this.props.filter);
        newFilter.search = value;
        newFilter.exact = exact;
        this.props.updateFilter(newFilter, extraQuery);
    }

    autocomplete = debounce(  (newVal:string) => {

        this.setState({loading:true});

        this.props.dataFetcher
            .autocomplete(
                getDbName(this.props),
                this.props.filter.attr.name,
                newVal,
                this.props.geofilter)
            .then((results) => {
                let searchResults = results.map((res:Autocomplete) : SearchResultProps => {
                    let {value, score, ...other} = res;
                    return {
                        title : value,
                        description: "" + score,
                        ...other
                    }
                });
                this.setState({results:searchResults, loading:false})
            });

    }, DEBOUNCE_DELAY);

    longEnough(value:string) {
       return !empty(value) && value.length > 2
    }

    // Debounced update
    updateValue(value:string) {
        this.setState({value});
        if (this.longEnough(value)) {
            this.autocomplete(value);
        }
    }

    selectResult(result:SearchResultProps) {
        this.updateValue(result.title);
        this.updateFilter(result.title, true);

        let extraQuery:Map<string> = null;
        if (this.props.geofilter) {

            let lat = (result.minlat + result.maxlat) / 2;
            let lon = (result.minlon + result.maxlon) / 2;

            // Update query to change map view
            extraQuery = viewPortToQuery({
                center: [lat, lon],
                zoom: CITY_ZOOM,
            });
        }
        this.updateFilter(result.title, true, extraQuery);

    }

    render() {
        let _ = this.props.messages;
        return <Search
            icon="filter"
            size="mini"
            noResultsMessage={_.no_results}
            placeholder={attrLabel(this.props.attr, this.props.messages)}
            loading={this.state.loading}
            onResultSelect={(e, data) => {this.selectResult(data.result)}}
            onSearchChange={(e, data) => {this.updateValue(data.value)}}
            onKeyPress = {(e:any) => {if (!this.props.geofilter && e.key == 'Enter') {this.updateFilter(this.state.value)}}}
            results={this.state.results}
            value={this.state.value}
            showNoResults={this.longEnough(this.state.value) && !this.state.loading}
        />
    }
}

interface NumberFilterExtraProps {
    hidemin?:boolean;
    hidemax?:boolean;
}

export class NumberFilterComponent extends AbstractSingleFilter<NumberFilter, NumberFilterExtraProps> {

    // Debounced update
    updateMin = debounce((min: number) => {
        let newFilter = Object.create(this.props.filter);
        newFilter.min = min;
        this.props.updateFilter(newFilter);
    }, DEBOUNCE_DELAY);

    updateMax = debounce((max: number) => {
        let newFilter = Object.create(this.props.filter);
        newFilter.max = max;
        this.props.updateFilter(newFilter);
    }, DEBOUNCE_DELAY);


    render() {
        let _ = this.props.messages;

        return <>
            {!this.props.hidemin && <div style={{marginBottom:"0.5em"}}>
                <Input
                    size="mini"
                    type="number"
                    label={_.min}
                    defaultValue={this.props.filter.min || ""}
                    onChange={(e, value) => this.updateMin(strToInt(value.value))}/>
            </div>}

            {!this.props.hidemax && <div>
                <Input
                    size="mini"
                    type="number"
                    label={_.max}
                    defaultValue={this.props.filter.max || ""}
                    onChange={(e, value) => this.updateMax(strToInt(value.value))}/>
            </div>}
        </>
    }
}

interface EnumFilterExtraProps {
    nbCols ?: number;
}



/** Wrap a filter within a component providing ann ""apply button */
export function withApplyButton<T, U> (
    WrappedComponent: React.ComponentType<SingleFilterProps<T> & U>,
): React.ComponentClass<SingleFilterProps<T> & U> {

    return class extends React.Component<SingleFilterProps<T> & U> {

        state : {filter : T };

        constructor(props:SingleFilterProps<T> & U) {
            super(props);
            this.state = {filter:this.props.filter}
        }


        updateFilter(filter: T) {
            this.setState({filter});
        }

        // Forward filter upstream
        doUpdateFilter() {
            this.props.updateFilter(this.state.filter);
        }

        public render() {

            let updateButton = isEqual(this.props.filter, this.state.filter) ? null :
                <Button
                style={{right:"0.5em", top:"0.5em", position: "absolute", zIndex:100}}
                content="appliquer"
                color="green"
                size="small"
                onClick={() => this.doUpdateFilter()}
                compact />

            return <div>
                {updateButton}
                <WrappedComponent {...this.props} updateFilter={(filter) => this.updateFilter(filter)} />
            </div>
        }
    };
}

export class EnumFilterComponent extends AbstractSingleFilter<EnumFilter, EnumFilterExtraProps> {

    state : {filter : EnumFilter};

    constructor(props: SingleFilterProps<EnumFilter> & EnumFilterExtraProps) {
        super(props);
        this.state = {filter:this.props.filter};
    }

    updateFilter(filter: EnumFilter) {
        this.setState({filter});
        this.props.updateFilter(filter);
    }

    toggleValue(value: string) {
        let newFilter = Object.create(this.state.filter);
        newFilter.showValues = copyArr(this.state.filter.showValues);
        if (isIn(this.state.filter.showValues, value)) {
            remove(newFilter.showValues, value);
        } else {
            newFilter.showValues.push(value);
        }

        this.updateFilter(newFilter);
    }

    toggleEmpty() {
        let newFilter = Object.create(this.state.filter);
        newFilter.showEmpty = !this.state.filter.showEmpty;
        this.updateFilter(newFilter);
    }

    render() {
        let _ = this.props.messages;
        let nbCols : any = this.props.nbCols || 1;

        let colWidths = {mobile:12, tablet:12 / nbCols, computer:12 / nbCols} as any;
        let checkboxes = this.state.filter.allValues().map(val => (
            <Grid.Column {...colWidths} style={{padding:"0.2rem"}} key={val} >
                <Checkbox
                    key={val}
                    checked={isIn(this.state.filter.showValues, val)}
                    onClick={() => this.toggleValue(val)}/>
                <ValueHandler
                    {...this.props}
                    value={val}
                    type={this.props.attr.type}
                    editMode={false}
                    onClick={() => this.toggleValue(val)}
                    style={{cursor:"pointer"}} />
        </Grid.Column>));

        return <div>
        <Grid style={{padding:"0.5em"}}>
            <Grid.Column {...colWidths} style={{padding:"0.2rem"}}>
            <Checkbox
                key="empty"
                label={_.empty}
                checked={this.state.filter.showEmpty}
                onClick={() => this.toggleEmpty()}/>
            </Grid.Column>
            {checkboxes}
        </Grid>
        </div>
    }
}

let ResetButton = (props: DbPageProps & {attr:Attribute}) =>  {
    let {messages:_, attr} = props;
    let clearFilter = () => {
        let queryParams = serializeFilter(attr, null);
        goToResettingPage(props, queryParams);
    };
    return <Button
            circular
            size="small"
            compact icon="delete" title={_.clear_filter}
            onClick={stopPropag(clearFilter)} />
};

/* Switch on attribute type : may return null in case filter is not supported */
// FIXME : change switch to proper registration of types / components
let FilterComponent = (props : DbPageProps, attr:Attribute, filter:Filter | null) => {

    let {messages: _} = props;

    let updateFilter = (newFilter: any, extraQuery: Map<string>) => {
        let queryParams = serializeFilter(attr, newFilter);
        if (extraQuery) {
            queryParams = {...queryParams, ...extraQuery};
        }
        goToResettingPage(props, queryParams);
    };

    switch(attr.type.tag) {

        case Types.BOOLEAN :
            return <BooleanFilterComponent
                {...props}
                attr={attr}
                updateFilter={updateFilter}
                filter={filter as BooleanFilter || new BooleanFilter(attr)} />;


        case Types.ENUM :
            let EnumFilterWithApplyButton = withApplyButton(EnumFilterComponent);
            return <EnumFilterWithApplyButton
                {...props}
                attr={attr}
                updateFilter={updateFilter}
                filter={filter as EnumFilter || new EnumFilter(attr)} />;

        case Types.TEXT :
            return <TextFilterComponent
                {...props}
                attr={attr}
                updateFilter={updateFilter}
                geofilter={attr.geofilter}
                filter={filter as TextFilter || new TextFilter(attr)} />;


        case Types.NUMBER :
            return <NumberFilterComponent
                {...props}
                attr={attr}
                updateFilter={updateFilter}
                filter={filter as NumberFilter || new NumberFilter(attr)} />;
        default:
            // Filter not supported for this type
            return null;
    }
}

/** Return an array of filter components, for the ones that have filters */
export function getFiltersComp(props: DbPageProps) {
    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(props.db.schema, queryParams);

    return props.db.schema.attributes
        // display only filters that are parts of currently displayed attributes
        .filter(attr => !attr.system && attr.display.summary)
        .map((attr) => ({
                attr,
                filter:filters[attr.name],
                component: FilterComponent(props, attr, filters[attr.name]),
                resetButton:filters[attr.name] && <ResetButton {...props} attr={attr} />}))
        .filter(({component}) => component != null);
}



export class FilterSidebar extends React.Component<DbPageProps> {

    constructor(props:DbPageProps) {
        super(props);
    }

    render() {
        let props = this.props;
        let _ = props.messages;

        return <div>
            {getFiltersComp(props).filter(({attr})=> attr.name != "commune").map(
                ({filter, attr, component, resetButton}) => {
                    return <div key={attr.name} >
                            <Header  attached="top" as="h5">
                                {ellipsis(attrLabel(attr, _))}
                                <p style={{float:"right"}}>{resetButton}</p>
                            </Header>
                            <Segment attached >
                                <div key={attr.name} >
                                    { component }
                                </div>
                            </Segment>
                        </div>
                    })}
        </div>
    }
}

/* Filter popup */
export const FiltersPopup : React.SFC<DbPageProps> = (props) => {

    let _ = props.messages;

    let bigPopupStyle = {
        width:"80%",
        left: "10%",
        right: "10%",
        maxWidth: "none"
    };

    let hasFilters = hasFiltersOrSearch(props.db.schema, props);

    let FilterModal=(innerProps:{close: ()=> void}) => <Modal
        open={true}
        closeIcon={true}
        onClose={()=> innerProps.close()} >

        <Header icon='filter' content={_.filters}/>

        <Modal.Content>
            <Grid columns={12}>
                {getFiltersComp(props).map( ({filter, attr, component, resetButton}) => {

                    return <Grid.Column mobile={12} tablet={6} computer={4}>
                        <Header as="h4">
                            {ellipsis(attrLabel(attr, _))}
                            <p style={{float:"right"}}>{resetButton}</p>
                        </Header>
                        <Divider/>
                        <div key={attr.name}>
                            {component}
                        </div>
                    </Grid.Column>
                })}
            </Grid>
        </Modal.Content>
    </Modal>

    return <Button.Group compact >
        <ButtonWrapper
                icon="filter"
                content={_.filters}
                render={(close) => <FilterModal close={() => close()} />}
                {...hasFilters && {attached:"left"}} />

        { hasFilters &&
        <Button
            iconed
            icon="delete"
            attached="right"
            title={_.clear_filters}
            onClick={() => clearFiltersOrSearch(props.db.schema, props) } />}
    </Button.Group>
};

/* Search component, for all fields */
class _SearchComponent extends React.Component<DbPageProps> {


    state : {value:string};

    getSearch = (props:DbPageProps) => {
        return extractSearch(parseParams(props.location.search))
    };

    constructor(props:DbPageProps) {
        super(props);
        this.state = {value : this.getSearch(props)};
    }

    // Don' update location / view on each key stroke ... wait a bit for it
    updateSearch() {
        goToResettingPage(this.props, serializeSearch(this.state.value));
    }

    // Reset search value if changed from upstream
    componentWillReceiveProps(nextProps: Readonly<DbPageProps>, nextContext: any): void {
        if (this.getSearch(nextProps) != this.getSearch(this.props)) {
            this.setState({value: this.getSearch(nextProps) || null})
        }
    }

    render() {
        let _ = this.props.messages;
        let placeholder = this.props.db.schema.attributes.
        filter(
            attr => (attr.type.tag == Types.TEXT
                && ! attr.system
                && !(attr.type as TextType).rich)).
        map(attr => attrLabel(attr, this.props.messages)).
        join();


        return <Input
            value={this.state.value}
            onChange={(e, data) => {this.setState({value:data.value})}}
            action={{
                icon:"search",
                onClick: (e:any, val:any) => {
                    e.stopPropagation();
                    this.updateSearch();
                }}}
            onKeyPress = {(e:any) => {if (e.key == 'Enter') {this.updateSearch()}}}
            placeholder={_.search}
        />
    }
}

export const SearchComponent = withRouter<DbPageProps>(_SearchComponent);