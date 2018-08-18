import * as React from "react";
import {Checkbox, Segment, Header, Input, Button} from "semantic-ui-react";
import {Location, History} from "history";
import {
    Filter,
    extractFilters,
    BooleanFilter,
    serializeFilter,
    EnumFilter,
    TextFilter,
    serializeSearch, parseSearch
} from "../../views/filters";
import {RouteComponentProps, withRouter} from "react-router";
import {Attribute, StructType, Types} from "../../model/types";
import {copyArr, goTo, isIn, parseParams, remove, updatedParams, updatedQuery} from "../../utils";
import {_} from "../../i18n/messages";
import  * as debounce from "debounce";

interface IFiltersComponentProps {
    schema:StructType;
}

interface IFilterComponentProps<T extends Filter> extends RouteComponentProps<{}> {
    filter: T;
    attribute: Attribute;
}

abstract class AbstractFilterComponent<T extends Filter> extends React.Component<IFilterComponentProps<T>> {

    // Update the filter by pushing new location
    setFilter = (newFilter: T) => {
        let queryParams = serializeFilter(this.props.attribute.name, newFilter);
        goTo(this.props, queryParams);
    }
}

class BooleanFilterComponent extends AbstractFilterComponent<BooleanFilter> {

    render() {
        let filter = this.props.filter;
       return <div>
            <Checkbox
                label={_.yes}
                checked={filter.showTrue}
                onClick={() => {
                    let newFilter = Object.create(filter);
                    newFilter.showTrue = ! filter.showTrue;
                    this.setFilter(newFilter);
                }} /><br/>
            <Checkbox
                label={_.no}
                checked={filter.showFalse}
                onClick={() => {
                    let newFilter =  Object.create(filter);
                    newFilter.showFalse = ! filter.showFalse;
                    this.setFilter(newFilter);
                }} />
            <br/>
        </div>
    }
}



class TextFilterComponent extends AbstractFilterComponent<TextFilter> {


    // Debounced update
    update = debounce((value: string) => {
        let newFilter = Object.create(this.props.filter);
        newFilter.search = value;
        this.setFilter(newFilter);
    }, 1000);

    render() {
        return <Input
            icon="filter"
            defaultValue={this.props.filter.search}
            onChange={(e, value) => this.update(value.value)}/>
    }
}


class EnumFilterComponent extends AbstractFilterComponent<EnumFilter> {

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
        let filter = this.props.filter;
        let checkboxes = filter.allValues().map(val => (<div key={val}>
            <Checkbox
                label={val}
                checked={isIn(filter.showValues, val)}
                onClick={() => this.toggleValue(val)}/>
        </div>));

        return <div>
            <div>
                <Checkbox
                    label={_.empty}
                    checked={filter.showEmpty}
                    onClick={() => this.toggleEmpty()}/>
            </div>
            {checkboxes}
        </div>
    }
}


// Main siwtch on attribute type
function toFilterComponent(props:RouteComponentProps<{}>,attr: Attribute, filter: Filter, location: Location, history:History) : any {

    let clearFilter = () => {
        let queryParams = serializeFilter(attr.name, null);
        goTo(props, queryParams);
    }

    let res = null;
    switch(attr.type.tag) {
        case Types.BOOLEAN :
            res = <BooleanFilterComponent
                attribute={attr}
                filter={filter as BooleanFilter || new BooleanFilter(attr)}
                {...props}
            />;
                break;
        case Types.ENUM :
            res = <EnumFilterComponent
                attribute={attr}
                filter={filter as EnumFilter || new EnumFilter(attr)}
                {...props}/>;
            break;
        case Types.TEXT :
            res = <TextFilterComponent
                attribute={attr}
                filter={filter as TextFilter || new TextFilter(attr)}
                {...props} />;
            break;
        default:
            // Filter not supported for this type
            return null;
    }

    return <Segment key={attr.name} >
        <div>
            <Header as="span" >
                {attr.name}
            </Header> {
                filter ?
                    <Button
                        circular size="mini"
                        compact icon="delete"
                        floated="right"
                        title={_.clear_filter}
                        onClick={() => clearFilter()}
                    /> : null
            }
        </div>
        {res}
    </Segment>;
}

type FiltersProps = IFiltersComponentProps & RouteComponentProps<{}>;

const Filters : React.SFC<FiltersProps> = (props:FiltersProps) => {

    let queryParams = parseParams(props.location.search);
    let filters = extractFilters(props.schema, queryParams);

  /* FIXME  :not working
    let clearFilters = () => {
        for (let attr in filters) {
            queryParams = updatedParams(queryParams, serializeFilter(attr, null))
        }
        goTo(props, queryParams);
    } */

    let children = props.schema.attributes.map((attr) =>
        toFilterComponent(
            props,
            attr,
            filters[attr.name],
            props.location,
            props.history)).
            filter(child => (child != null));


    return <>
        <div style={{textAlign:"center"}}>
            <Header as={"span"} >
                {_.filters}
            </Header>

        </div>

        <div style={{margin:"1em"}}>
            {children}
        </div>
    </>
}
export const ConnectedFilters = withRouter<IFiltersComponentProps>(Filters);

class SearchComponent extends React.Component<IFiltersComponentProps & RouteComponentProps<{}>> {

    updateSearch = debounce((search: string) => {
        goTo(this.props, serializeSearch(search));
    }, 1000);

    render() {
        let search = parseSearch(parseParams(this.props.location.search));
        return <Input icon="filter"
                      defaultValue={search}
                      onChange={(e, val) => this.updateSearch(val.value)} />
    }
}
export const ConnectedSearchComponent = withRouter<IFiltersComponentProps>(SearchComponent);