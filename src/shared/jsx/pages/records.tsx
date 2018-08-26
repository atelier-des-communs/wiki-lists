/* Main page displaying a single collection, with sorting, filtering, grouping */
import * as React from 'react';
import {Button, Header, Dropdown} from 'semantic-ui-react'
import { EditDialog } from "../dialogs/edit-dialog";
import {Attribute, attributesMap, StructType, Types} from "../../model/types";
import {deepClone, getDbName, goTo, Map, mapMap, parseParams} from "../../utils";
import {_} from "../../i18n/messages";
import {SafeClickWrapper, SafePopup} from "../utils/ssr-safe";
import {connect, Dispatch} from "react-redux";
import {
    createAddItemAction,
    IState,
    createDeleteAction,
    createUpdateItemAction,
    createUpdateSchema
} from "../../redux/index";

import {RouteComponentProps, withRouter} from "react-router"
import {Record} from "../../model/instances";
import {FiltersPopup, ConnectedSearchComponent} from "../type-handlers/filters";
import {applySearchAndFilters, clearFiltersOrSearch, hasFiltersOrSearch} from "../../views/filters";
import {CollectionEventProps, CollectionRouteProps, RecordProps} from "../components/props";
import {ConnectedTableComponent} from "../components/table";
import {extractGroupBy, groupBy, updatedGroupBy} from "../../views/group";
import {Collapsible} from "../utils/collapsible";
import {SchemaDialog} from "../dialogs/schema-dialog";
import {createItem, deleteItem, updateItem, updateSchema} from "../../rest/client";
import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../../rest/api";
import {DropdownItemProps} from "semantic-ui-react/dist/commonjs/modules/Dropdown/DropdownItem"
import {SortPopup} from "../components/sort-popup";
import {extractViewType, serializeViewType, ViewType} from "../../views/view-type";
import {CardsComponent} from "../components/cards";
import {ValueHandler} from "../type-handlers/editors";

type CollectionProps = RecordProps & CollectionEventProps & RouteComponentProps<CollectionRouteProps>;


function records(groupAttr: string, props:CollectionProps, viewType: ViewType) {

    let attrMap = attributesMap(props.schema);

    let recordsComponent = (records: Record[]) => {
        let result = null;
        switch (viewType) {
            case ViewType.TABLE :
                result =  <ConnectedTableComponent
                    {...props}
                    records={records} />
                break;
            case ViewType.CARDS:
                result =  <CardsComponent {...props} records={records} />;
                break;
            default :
                throw new  Error(`unsupported view type : ${viewType}`)
        }
        return <div style={{marginTop:"1em", marginRight:"1em"}}>
            {result}
        </div>
    };

    if (groupAttr) {

        let attr = attrMap[groupAttr];
        let groups = groupBy(props.records, attr);
        let sections = groups.map(group =>
            <div>
                <Collapsible trigger={open =>
                    <div style={{marginTop:"1em"}} >
                    <Button circular compact size="small" icon={open ? "chevron down" : "chevron right"} />
                    <Header
                        as="span"
                        size="medium"
                        style={{marginTop:"1em", cursor:"pointer"}}>

                        {groupAttr} :
                            <ValueHandler
                                type={attr.type}
                                value={group.value}
                                editMode={false} />
                    </Header></div>} >

                    {recordsComponent(group.records)}
                </Collapsible>
            </div>);

        return <>
            {sections}
        </>
    } else {
        return recordsComponent(props.records);
    }
}


class RecordsPageInternal extends  React.Component<CollectionProps> {


    constructor(props:CollectionProps) {
        super(props);
        this.state = {filtersSideBar : true}
    }

    render() {
        let props = this.props;
        let dbName = getDbName(props);

        let params = parseParams(props.location.search);

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


        let groupAttr = extractGroupBy(parseParams(props.location.search));
        let groupOptions = props.schema.attributes

            // FIXME find declarative way to handle types that can support grouping
            .filter(attr => attr.type.tag == Types.ENUM  || attr.type.tag ==  Types.BOOLEAN)
            .map(attr => (
                {value:attr.name,
                    text:attr.name} as DropdownItemProps));

        groupOptions = [{value:null, text:_.empty_group_by} as DropdownItemProps].concat(groupOptions);

        let groupByDropdown = <Dropdown inline
                button className="icon" icon="plus square outline"
                labeled placeholder={_.group_by}
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

        let setViewType = (viewType: ViewType) => {
            goTo(props, serializeViewType(viewType));
        }
        let viewType = extractViewType(params);
        let viewTypeButtons = <Button.Group basic>
            <Button icon="table"
                    title={`${_.view_type} : ${_.table_view}`}
                    active={viewType == ViewType.TABLE}
                    onClick={() => setViewType(ViewType.TABLE)} />
            <Button icon="grid layout"
                    title={`${_.view_type} : ${_.card_view}`}
                    active={viewType == ViewType.CARDS}
                    onClick={() => setViewType(ViewType.CARDS)}/>
        </Button.Group>;


        return <>
            <div style={{display:"table", width:"100%", padding:"1em"}}>
                <div style={{display:"table-cell", width:"100%"}}>

                    <div style={{float:"right"}} >
                        <ConnectedSearchComponent schema={props.schema} />
                        { DownloadButton }
                    </div>

                    <div>
                        { AddItemButton }
                        { UpdateSchemaButton }
                    </div>

                    <div>
                        { viewTypeButtons } &nbsp;
                        { sortByDropdown }
                        { groupByDropdown}
                        { <FiltersPopup {...props} schema={this.props.schema} /> }
                    </div>

                    { records(groupAttr, props, viewType) }
                </div>
            </div>
        </>
    }
}


// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, routerProps?: RouteComponentProps<{}>) : RecordProps => {

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
const matchDispatchToProps = (dispatch: Dispatch<{}>, props?: RouteComponentProps<CollectionRouteProps>) : CollectionEventProps => {

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

};

// connect to redux
export let RecordsPage = connect<RecordProps, CollectionEventProps, RouteComponentProps<{}>>(
    mapStateToProps,
    matchDispatchToProps
)(RecordsPageInternal);
