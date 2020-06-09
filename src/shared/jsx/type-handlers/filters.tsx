import * as React from "react";
import {Button, Checkbox, Divider, Grid, Header, Icon, Input, Popup, Segment} from "semantic-ui-react";
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
import {Attribute, StructType, Types} from "../../model/types";
import {copyArr, goTo, isIn, parseParams, remove, stopPropag, strToInt} from "../../utils";
import * as debounce from "debounce";
import {SafePopup} from "../utils/ssr-safe";
import {attrLabel, ellipsis} from "../utils/utils";
import {ValueHandler} from "./editors";
import {MessagesProps} from "../../i18n/messages";
import {ResponsiveButton} from "../components/responsive";


const DEBOUNCE_DELAY= 1000;

interface IFiltersComponentProps extends MessagesProps {
    schema:StructType;
}


// Main siwtch on attribute type
interface SingleFilterProps<T> extends RouteComponentProps<{}>, MessagesProps {
    attr: Attribute;
    filter: T;
}

abstract class AbstractSingleFilter<T extends Filter> extends React.Component<SingleFilterProps<T>> {

    // Update the filter by pushing query params in URL
    setFilter = (newFilter: T) => {
        let queryParams = serializeFilter(this.props.attr, newFilter);
        console.log("filter clicked !", this.props.attr, queryParams);
        goTo(this.props, queryParams);
    }
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
                    this.setFilter(newFilter);
                }} />
           &nbsp;
            <Checkbox
                label={_.no}
                checked={filter.showFalse}
                onClick={() => {
                    let newFilter =  Object.create(filter);
                    newFilter.showFalse = ! filter.showFalse;
                    this.setFilter(newFilter);
                }} />
            <br/>
        </>
    }
}



class TextFilterComponent extends AbstractSingleFilter<TextFilter> {

    // Debounced update
    update = debounce((value: string) => {
        let newFilter = Object.create(this.props.filter);
        newFilter.search = value;
        this.setFilter(newFilter);
    }, DEBOUNCE_DELAY);

    render() {
        return <Input
            icon="filter"
            size="mini"
            defaultValue={this.props.filter.search}
            onChange={(e, value) => this.update(value.value)}/>
    }
}

class NumberFilterComponent extends AbstractSingleFilter<NumberFilter> {

    // Debounced update
    updateMin = debounce((min: number) => {
        let newFilter = Object.create(this.props.filter);
        newFilter.min = min;
        this.setFilter(newFilter);
    }, DEBOUNCE_DELAY);

    updateMax = debounce((max: number) => {
        let newFilter = Object.create(this.props.filter);
        newFilter.max = max;
        this.setFilter(newFilter);
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


class EnumFilterComponent extends AbstractSingleFilter<EnumFilter> {

    toggleValue(value: string) {
        let filter = this.props.filter;
        let newFilter = Object.create(filter);
        newFilter.showValues = copyArr(filter.showValues);
        if (isIn(filter.showValues, value)) {
            remove(newFilter.showValues, value);
        } else {
            newFilter.showValues.push(value);
        }
        this.setFilter(newFilter);
    }

    toggleEmpty() {
        let filter = this.props.filter;
        let newFilter = Object.create(filter);
        newFilter.showEmpty = !filter.showEmpty;
        this.setFilter(newFilter);
    }

    render() {
        let _ = this.props.messages;
        let filter = this.props.filter;
        let checkboxes = filter.allValues().map(val => (<div>
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
        </div>));

        return <div className="enum-filter" >
            <Checkbox
                key="empty"
                label={_.empty}
                checked={filter.showEmpty}
                onClick={() => this.toggleEmpty()}/>
            {checkboxes}
        </div>
    }
}

/* Switch on attribute type : may return null in case filter is not supported */
export function singleFilter(props : RouteComponentProps<{}> & MessagesProps, attr:Attribute, filter:Filter | null) {

    let _ = props.messages;

    let clearFilter = () => {
        let queryParams = serializeFilter(attr, null);
        goTo(props, queryParams);
    };

    let filterComp = null;

    switch(attr.type.tag) {

        case Types.BOOLEAN :
            filterComp = <BooleanFilterComponent
                {...props}
                attr={attr}
                filter={filter as BooleanFilter || new BooleanFilter(attr)} />;
                break;

        case Types.ENUM :
            filterComp = <EnumFilterComponent
                {...props}
                attr={attr}
                filter={filter as EnumFilter || new EnumFilter(attr)} />;
            break;

        case Types.TEXT :
            filterComp = <TextFilterComponent
                {...props}
                attr={attr}
                filter={filter as TextFilter || new TextFilter(attr)} />;
            break;


        case Types.NUMBER :
            filterComp = <NumberFilterComponent
                {...props}
                attr={attr}
                filter={filter as NumberFilter || new NumberFilter(attr)} />;
            break;

        default:
            // Filter not supported for this type
            return null;
    }

    return <div className="wl-filter">
        {filter &&
         <Button
            circular size="mini" compact  floated="right"
            icon="delete"
            title={_.clear_filter}
            onClick={stopPropag(clearFilter)} />
        }
        {filterComp}
    </div>
}

/** Return an array of filter components, for the ones that have filters */
function getFilters(props: IFiltersComponentProps & RouteComponentProps<{}>) {
    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(props.schema, queryParams);

    return props.schema.attributes
        .filter(attr => !attr.system)
        .map((attr) => ({attr, comp:singleFilter(props, attr, filters[attr.name])}))
        .filter((res) => res.comp != null);
}

export const FilterSidebar : React.SFC<IFiltersComponentProps & RouteComponentProps<{}>> = (props) => {

    let _ = props.messages;

    return <div>
        <Header as="h3">{_.filters}</Header>
    {getFilters(props).map( item =>
        <Segment>
            <Header as="h4">
                { ellipsis(attrLabel(item.attr)) }
            </Header>
            <Divider/>
            <div key={item.attr.name} >
                { item.comp }
            </div>
        </Segment>
    )}
    </div>
}

/* Filter popup */
export const FiltersPopup : React.SFC<IFiltersComponentProps & RouteComponentProps<{}>> = (props) => {

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
            {getFilters(props).map( item =>
                <Grid.Column mobile={12} tablet={6} computer={4} >
                    <Header as="h4">
                        {ellipsis(attrLabel(item.attr))}
                    </Header>
                    <Divider/>
                    <div key={item.attr.name} >
                        { item.comp }
                    </div>
                </Grid.Column>
            )}
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
class SearchComponentInternal extends React.Component<IFiltersComponentProps & RouteComponentProps<{}>> {

    // Don' update location / view on each key stroke ... wait a bit for it
    updateSearch = debounce((search: string) => {
        goTo(this.props, serializeSearch(search));
    }, DEBOUNCE_DELAY);

    render() {
        let search = extractSearch(parseParams(this.props.location.search));
        return <Input icon="filter"
                      defaultValue={search}
                      onChange={(e, val) => {
                          e.stopPropagation(),
                          this.updateSearch(val.value)
                      }} />
    }
}

export const SearchComponent = withRouter<IFiltersComponentProps>(SearchComponentInternal);