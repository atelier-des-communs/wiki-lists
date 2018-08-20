
import * as React from 'react';
import {
    Button,
    Container,
    Popup,
    Icon,
    Input, Table, Header, Dropdown
} from 'semantic-ui-react'
import { EditDialog } from "./edit-dialog";
import {Attribute, StructType, Types} from "../model/types";
import {deepClone, getDbName, goTo, Map, mapMap, parseParams} from "../utils";
import {_} from "../i18n/messages";
import {SafeClickWrapper, SafePopup} from "./utils/ssr-safe";
import {connect, Dispatch} from "react-redux";
import {
    createAddItemAction,
    IState,
    createDeleteAction,
    createUpdateItemAction,
    createUpdateSchema
} from "../redux";

import {RouteComponentProps, withRouter} from "react-router"
import {Record} from "../model/instances";
import {FiltersSidebar, ConnectedSearchComponent} from "./type-handlers/filters";
import {applySearchAndFilters, clearFiltersOrSearch, hasFiltersOrSearch} from "../views/filters";
import {CollectionEventProps, ReduxProps} from "./common";
import {ConnectedTableComponent} from "./table";
import {extractGroupBy, groupBy, updatedGroupBy} from "../views/group";
import {Collapsible} from "./utils/collapsible";
import {SchemaDialog} from "./schema-dialog";
import {createItem, deleteItem, updateItem, updateSchema} from "../rest/client";
import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../rest/api";
import {DropdownItemProps} from "semantic-ui-react/dist/commonjs/modules/Dropdown/DropdownItem"
import {SortPopup} from "./sort-popup";

type CollectionProps = ReduxProps & CollectionEventProps & RouteComponentProps<{}>;


function records(groupAttr: string, props:CollectionProps) {

    if (groupAttr) {
        let groups = groupBy(props.records, groupAttr);
        let sections = groups.map(group =>
            <div>
                <Collapsible trigger={open =>
                    <div style={{marginTop:"1em"}} >
                    <Button circular compact size="small" icon={open ? "chevron down" : "chevron right"} />
                    <Header
                        as="span"
                        size="medium"
                        style={{marginTop:"1em", cursor:"pointer"}}>

                        {groupAttr} : {group.key}
                    </Header></div>} >

                    <ConnectedTableComponent
                        onUpdate={props.onUpdate}
                        onCreate={props.onCreate}
                        onDelete={props.onDelete}
                        onUpdateSchema={props.onUpdateSchema}
                        schema={props.schema}
                        records={group.records}
                    />
                </Collapsible>
            </div>);

        return <>
            {sections}
        </>
    } else {
        return <ConnectedTableComponent
            onUpdate={props.onUpdate}
            onCreate={props.onCreate}
            onDelete={props.onDelete}
            onUpdateSchema={props.onUpdateSchema}
            schema={props.schema}
            records={props.records}
        />
    }
}


class CollectionComponent extends  React.Component<CollectionProps> {

    state : {
        filtersSideBar : boolean;
    }

    constructor(props:CollectionProps) {
        super(props);
        this.state = {filtersSideBar : true}
    }

    toggleFilters() {
        this.setState({filtersSideBar : !this.state.filtersSideBar})
    }

    render() {
        let props = this.props;
        let dbName = getDbName(props);
        let xls_link =
            DOWNLOAD_XLS_URL.replace(":db_name", dbName)
            + props.location.search;
        let json_link =
            DOWNLOAD_JSON_URL.replace(":db_name", dbName)
            + props.location.search;

        let DownloadButton= <SafePopup trigger={<Button icon="download" basic />} >
            <>
                <a href={xls_link}><b>Excel</b></a>
                <br/>
                <a href={json_link}><b>JSON</b></a>
            </>
            </SafePopup>;

        // Add item dilaog and button
        let AddItemButton = <SafeClickWrapper  trigger={
                <Button primary style={{marginBottom:"1em"}} icon="plus" content={_.add_item} />
            }>
                <EditDialog
                    value={{}}
                    schema={props.schema}
                    create={true}
                    onUpdate={props.onCreate}  />
            </SafeClickWrapper>;


        let clearFiltersButton = hasFiltersOrSearch(props.schema, props) &&
            <Button
                content={_.clear_filters}
                onClick={() => clearFiltersOrSearch(props.schema, props) }/>


        let groupAttr = extractGroupBy(parseParams(props.location.search));
        let groupOptions = props.schema.attributes
            .filter(attr => attr.type.tag == Types.ENUM)
            .map(attr => (
                {value:attr.name,
                    text:attr.name} as DropdownItemProps));

        groupOptions = [{value:null, text:_.empty_group_by} as DropdownItemProps].concat(groupOptions);

        let groupByDropdown = <Dropdown
                 inline
                button className="icon"
                 icon="plus square outline"
                labeled
                placeholder={_.group_by}
                options={groupOptions}
                value={groupAttr}
                onChange={(e, update) =>
                    goTo(props, updatedGroupBy(update.value as string))} />

        let sortByDropdown = <SortPopup {...props} />

        let UpdateSchemaButton = <SafeClickWrapper trigger={
            <Button icon="configure"
                    color="teal"
                    content={_.edit_attributes} />} >
                <SchemaDialog
                    onUpdateSchema={props.onUpdateSchema}
                    schema={props.schema}
            />
        </SafeClickWrapper>;

        let toggleSideBarButton = <Button
            title = {_.toggle_filters}
            icon={this.state.filtersSideBar ? "angle double left" : "angle double right"}
            onClick={() => this.toggleFilters()}
        />

        return <>


            <div style={{display:"table", width:"100%", padding:"1em"}}>

                { this.state.filtersSideBar &&
                    <div style={{display: "table-cell"}}>
                        <FiltersSidebar
                            {...props}
                            schema={props.schema} />
                    </div>}

                <div style={{display:"table-cell", width:"100%"}}>

                    <div style={{float:"right"}} >
                        <ConnectedSearchComponent schema={props.schema} />
                        { DownloadButton }
                    </div>

                    <div>
                        { toggleSideBarButton }

                        { AddItemButton }
                        { UpdateSchemaButton }
                    </div>

                    <div>
                        { sortByDropdown }
                        { groupByDropdown}
                        { clearFiltersButton }
                    </div>

                    { records(groupAttr, props) }
                </div>
            </div>
        </>
    }
}


// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, routerProps?: RouteComponentProps<{}>) : ReduxProps => {

    // Flatten map of records
    let records = mapMap(state.items,(key, item) => item) as Map[];

    // Apply search and sorting
    let params = parseParams(routerProps.location.search);
    records = applySearchAndFilters(records, params, state.schema);

    return {
        schema: state.schema,
        records: records}
};

// Send actions to redux store upon events
const matchDispatchToProps = (dispatch: Dispatch<{}>, props?: RouteComponentProps<{}>) : CollectionEventProps => {

    // Get db Name from URL
    // FIXME : bad, get it from global context
    let dbName = getDbName(props);

    let onCreate = (record: Record) : Promise<void> => {
        return createItem(dbName, record).then(function(responseValue) {
            dispatch(createAddItemAction(responseValue));
        })
    };

    let onUpdate = (record: Record) : Promise<void> => {
        return updateItem(dbName, record).then(function(responseValue) {
            dispatch(createUpdateItemAction(responseValue));
        })
    };

    let onDelete = (id: string) : Promise<void> => {
        return deleteItem(dbName, id).then(function() {
            dispatch(createDeleteAction(id));
        })
    };

    let onUpdateSchema = (schema: StructType) => {
        return updateSchema(dbName, schema).then(function(responseValue) {
            dispatch(createUpdateSchema(responseValue));
        })
    };

    return {
        onCreate,
        onUpdate,
        onDelete,
        onUpdateSchema}

}

// connect to redux
let CollectionComponentWithRedux = connect<ReduxProps, CollectionEventProps, RouteComponentProps<{}>>(
    mapStateToProps,
    matchDispatchToProps
)(CollectionComponent);

// Inject route props
export const ConnectedCollectionComponent = withRouter<{}>(CollectionComponentWithRedux);

