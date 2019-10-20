import * as React from "react";
import {Button, Checkbox, Divider, Grid, Header, Icon, Input, Popup, Segment, Search, SearchResultProps} from "semantic-ui-react";
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
    copyArr,
    getDbName,
    goTo,
    goToResettingPage,
    isIn,
    parseParams,
    remove,
    stopPropag,
    strToInt
} from "../../utils";
import * as debounce from "debounce";
import {SafePopup} from "../utils/ssr-safe";
import {attrLabel, ellipsis} from "../utils/utils";
import {ValueHandler} from "./editors";
import {MessagesProps} from "../../i18n/messages";
import {ResponsiveButton} from "../components/responsive";
import {GlobalContextProps} from "../context/global-context";
import {dbNameSSR} from "../../../server/utils";
import {DbPageProps} from "../pages/db/db-page-switch";
import {Autocomplete} from "../../api";
import {viewPortToQuery} from "../pages/db/map";


const DEBOUNCE_DELAY= 500;
const CITY_ZOOM = 14;

interface IFiltersComponentProps extends MessagesProps {
    schema:StructType;
}


// Main siwtch on attribute type
interface SingleFilterProps<T> extends DbPageProps  {
    updateFilter : (newFilter:T) => void;
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

    updateFilter(value:string, exact:boolean=false) {
        let newFilter : TextFilter = Object.create(this.props.filter);
        newFilter.search = value;
        newFilter.exact = exact;
        this.props.updateFilter(newFilter);
    }

    autocomplete = debounce(  (newVal:string) => {

        this.setState({loading:true});

        this.props.dataFetcher.autocomplete(
            getDbName(this.props),
            this.props.filter.attr.name,
            newVal,
            this.props.geofilter).then((results) => {
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

    // Debounced update
    updateValue(value:string) {
        this.setState({value});
        if (value && value.length > 2) {
            this.autocomplete(value);
        }
    }

    selectResult(result:SearchResultProps) {
        this.updateValue(result.title);
        this.updateFilter(result.title, true);


        if (this.props.geofilter) {

            let lat = (result.minlat + result.maxlat) / 2;
            let lon = (result.minlon + result.maxlon) / 2;

            // Update query to change map view
            let query = viewPortToQuery({
                center: [lat, lon],
                zoom: CITY_ZOOM,
            });
            goTo(this.props, query);
        }
    }

    render() {
        let _ = this.props.messages;
        return <Search
            icon="filter"
            size="mini"
            noResultsMessage={_.no_results}
            loading={this.state.loading}
            onResultSelect={(e, data) => {this.selectResult(data.result)}}
            onSearchChange={(e, data) => {this.updateValue(data.value)}}
            onKeyPress = {(e:any) => {if (!this.props.geofilter && e.key == 'Enter') {this.updateFilter(this.state.value)}}}
            results={this.state.results}
            value={this.state.value}
            showNoResults={this.state.value && !this.state.loading}
        />
    }
}

class NumberFilterComponent extends AbstractSingleFilter<NumberFilter> {

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
        <div style={{marginBottom:"0.5em"}}>
            <Input
                size="mini"
                type="number"
                label={_.min}
                defaultValue={this.props.filter.min}
                onChange={(e, value) => this.updateMin(strToInt(value.value))}/>
        </div>

        <div>
            <Input
                size="mini"
                type="number"
                label={_.max}
                defaultValue={this.props.filter.max}
                onChange={(e, value) => this.updateMax(strToInt(value.value))}/>
        </div>
        </>
    }
}

interface EnumFilterExtraProps {
    nbCols ?: number;
}

export class EnumFilterComponent extends AbstractSingleFilter<EnumFilter, EnumFilterExtraProps> {

    toggleValue(value: string) {
        let filter = this.props.filter;
        let newFilter = Object.create(filter);
        newFilter.showValues = copyArr(filter.showValues);
        if (isIn(filter.showValues, value)) {
            remove(newFilter.showValues, value);
        } else {
            newFilter.showValues.push(value);
        }
        this.props.updateFilter(newFilter);
    }

    toggleEmpty() {
        let filter = this.props.filter;
        let newFilter = Object.create(filter);
        newFilter.showEmpty = !filter.showEmpty;
        this.props.updateFilter(newFilter);
    }

    render() {
        let _ = this.props.messages;
        let filter = this.props.filter;
        let nbCols : any = this.props.nbCols || 1;
        let checkboxes = filter.allValues().map(val => (<Grid.Column style={{padding:"0.2rem"}}>
            <Checkbox
                key={val}
                checked={isIn(filter.showValues, val)}
                onClick={() => this.toggleValue(val)}/>
            <ValueHandler
                {...this.props}
                value={val}
                type={this.props.attr.type}
                editMode={false}
                onClick={() => this.toggleValue(val)}
                style={{cursor:"pointer"}} />
        </Grid.Column>));

        return <Grid fluid stackable columns={nbCols} style={{padding:"1em"}}>
            <Grid.Column style={{padding:"0.2rem"}}>
            <Checkbox
                key="empty"
                label={_.empty}
                checked={filter.showEmpty}
                onClick={() => this.toggleEmpty()}/>
            </Grid.Column>
            {checkboxes}
        </Grid>
    }
}

let ResetButton = (props: DbPageProps & {attr:Attribute}) =>  {
    let {messages:_, attr} = props;
    let clearFilter = () => {
        let queryParams = serializeFilter(attr, null);
        goToResettingPage(props, queryParams);
    };
    return <p style={{float:"right"}}>
        <Button
            circular size="small"
            icon="delete"
            title={_.clear_filter}
            onClick={stopPropag(clearFilter)} />
    </p>
}

/* Switch on attribute type : may return null in case filter is not supported */
// FIXME : change switch to proper registration of types / components
let FilterComponent = (props : DbPageProps, attr:Attribute, filter:Filter | null) => {

    let {messages: _} = props;

    let updateFilter = (newFilter: any) => {
        let queryParams = serializeFilter(attr, newFilter);
        goToResettingPage(props, queryParams);
    }

    switch(attr.type.tag) {

        case Types.BOOLEAN :
            return <BooleanFilterComponent
                {...props}
                attr={attr}
                updateFilter={updateFilter}
                filter={filter as BooleanFilter || new BooleanFilter(attr)} />;


        case Types.ENUM :
            return <EnumFilterComponent
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
function getFilters(props: IFiltersComponentProps & DbPageProps) {
    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(props.schema, queryParams);

    return props.schema.attributes
        // display only filters that are parts of currently displayed attributes
        .filter(attr => !attr.system && attr.display.summary)
        .map((attr) => ({
                attr,
                filter:filters[attr.name]}));
}

export class FilterSidebar extends React.Component<IFiltersComponentProps & DbPageProps> {

    constructor(props:IFiltersComponentProps & DbPageProps) {
        super(props);
    }

    render() {
        let props = this.props;
        let _ = props.messages;

        return <div>
            {getFilters(props).map(
                ({filter, attr}) => {
                    let filtercomp = FilterComponent(props, attr, filter);
                    if (!filtercomp) return null;
                    return <>
                            <Header  attached="top" as="h5">
                                {ellipsis(attrLabel(attr, _))}
                                {filter && <ResetButton {...props} attr={attr} />}
                            </Header>
                            <Segment attached >
                                <div key={attr.name} >
                                    { filtercomp }
                                </div>
                            </Segment>
                        </>
                    })}
        </div>
    }
}

/* Filter popup */
export const FiltersPopup : React.SFC<IFiltersComponentProps & DbPageProps> = (props) => {

    let _ = props.messages;

    let bigPopupStyle = {
        width:"80%",
        left: "10%",
        right: "10%",
        maxWidth: "none"
    };

    let hasFilters = hasFiltersOrSearch(props.schema, props);

    return <Button.Group>
    <SafePopup position="bottom center" className="big-popup" style={bigPopupStyle} trigger={
            <ResponsiveButton
                icon="filter"
                content={_.filters}
                {...hasFilters && {attached:"left"}} />
        }>
        <Popup.Content>
            <Header as={"h3"}>{_.filters}</Header>
        <Grid columns={12}>
            {getFilters(props).map( ({filter, attr}) => {

                let filtercomp = FilterComponent(props, attr, filter);
                if (!filtercomp) return null;

                return <Grid.Column mobile={12} tablet={6} computer={4}>
                    <Header as="h4">
                        {ellipsis(attrLabel(attr, _))}
                        {filter && <ResetButton {...props} attr={attr}/>}
                    </Header>
                    <Divider/>
                    <div key={attr.name}>
                        {filtercomp}
                    </div>
                </Grid.Column>
            })}
        </Grid>
        </Popup.Content>
    </SafePopup>

        { hasFilters &&
        <Button
            iconed
            icon="delete"
            attached="right"
            title={_.clear_filters}
            onClick={() => clearFiltersOrSearch(props.schema, props) } />}
    </Button.Group>
};

/* Search component, for all fields */
type SearchCompoentProps = IFiltersComponentProps & RouteComponentProps<{}>;
class _SearchComponent extends React.Component<SearchCompoentProps> {


    state : {value:string};

    getSearch = (props:SearchCompoentProps) => {
        return extractSearch(parseParams(props.location.search))
    };

    constructor(props:SearchCompoentProps) {
        super(props);
        this.state = {value : this.getSearch(props)};
    }

    // Don' update location / view on each key stroke ... wait a bit for it
    updateSearch() {
        goToResettingPage(this.props, serializeSearch(this.state.value));
    }

    // Reset search value if changed from upstream
    componentWillReceiveProps(nextProps: Readonly<SearchCompoentProps>, nextContext: any): void {
        if (this.getSearch(nextProps) != this.getSearch(this.props)) {
            this.setState({value: this.getSearch(nextProps) || null})
        }
    }

    render() {
        let _ = this.props.messages;
        let placeholder = this.props.schema.attributes.
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

export const SearchComponent = withRouter<IFiltersComponentProps>(_SearchComponent);