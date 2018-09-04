/* Main page displaying a single collection, with sorting, filtering, grouping */
import * as React from 'react';
import {Button, Dropdown, Header} from 'semantic-ui-react'
import { EditDialog } from "../dialogs/edit-dialog";
import {Attribute, attributesMap, StructType, Types} from "../../model/types";
import {deepClone, goTo, Map, mapMap, parseParams} from "../../utils";
import {_} from "../../i18n/messages";
import {SafeClickWrapper, SafePopup} from "../utils/ssr-safe";
import {connect, Dispatch, DispatchProp} from "react-redux";
import {
    createAddItemAction,
    IState,
    createDeleteAction,
    createUpdateItemAction,
    createUpdateSchema
} from "../../redux/index";

import {RouteComponentProps, withRouter} from "react-router"
import {Record} from "../../model/instances";
import {FiltersPopup, SearchComponent} from "../type-handlers/filters";
import {applySearchAndFilters, clearFiltersOrSearch, hasFiltersOrSearch} from "../../views/filters";
import {ReduxEventsProps, DbPathParams, RecordsProps} from "../common-props";
import {ConnectedTableComponent} from "../components/table";
import {extractGroupBy, groupBy, updatedGroupBy} from "../../views/group";
import {Collapsible} from "../utils/collapsible";
import {SchemaDialog} from "../dialogs/schema-dialog";
import {createItem, deleteItem, updateItem, updateSchema} from "../../rest/client";
import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../../api";
import {DropdownItemProps} from "semantic-ui-react/dist/commonjs/modules/Dropdown/DropdownItem"
import {SortPopup} from "../components/sort-popup";
import {extractViewType, serializeViewType, ViewType} from "../../views/view-type";
import {CardsComponent} from "../components/cards";
import {ValueHandler} from "../type-handlers/editors";
import {AttributeDisplayComponent} from "../components/attribute-display";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {AccessRight} from "../../access";
import {attrLabel} from "../utils/utils";
import {connectPage} from "../context/redux-helpers";

type RecordsPageProps =
    GlobalContextProps &
    RecordsProps & // mapped from redux react
    RouteComponentProps<DbPathParams> &
    ReduxEventsProps &
    DispatchProp<any>;


function groupedRecords(groupAttr: string, props:RecordsPageProps, viewType: ViewType) {

    let attrMap = attributesMap(props.schema);

    // Switch on type of view
    let recordsSwitch = (records: Record[]) => {
        switch (viewType) {
            case ViewType.TABLE :
                return  <ConnectedTableComponent
                    {...props}
                    records={records} />
            case ViewType.CARDS:
                return  <CardsComponent {...props} records={records} />;
            default :
                throw new  Error(`unsupported view type : ${viewType}`)
        }
    };

    let nothingHere = <div style={{textAlign:"center"}}>
        <Header>{_.no_element}</Header>
        {addItemButton(props)}
        {hasFiltersOrSearch(props.schema, props) &&
        <Button icon="delete"
                onClick={() => clearFiltersOrSearch(props.schema, props)} >
            {_.clear_filters}
        </Button>}
    </div>

    let recordsComponent = (records: Record[]) => {
        return <div style={{marginTop:"1em", marginRight:"1em"}}>
            {records.length == 0 ? nothingHere
                : recordsSwitch(records)}
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

                        {attrLabel(attr)} :
                            <ValueHandler
                                type={attr.type}
                                value={group.value}
                                editMode={false} />
                    </Header></div>} >

                    {recordsComponent(group.records)}
                </Collapsible>
            </div>);

        return <>{
                sections.length == 0 ?
                nothingHere : sections}
            </>
    } else {
        return recordsComponent(props.records);
    }
}

function addItemButton(props: RecordsPageProps) {
    return props.auth.hasRight(AccessRight.EDIT) && <SafeClickWrapper  trigger={
        <Button primary style={{marginBottom:"1em"}} icon="plus" content={_.add_item} />
    }>
        <EditDialog
            record={{}}
            schema={props.schema}
            create={true}
            onUpdate={props.onCreate}  />
    </SafeClickWrapper>
}


class RecordsPageInternal extends  React.Component<RecordsPageProps> {


    constructor(props:RecordsPageProps) {
        super(props);
        this.state = {filtersSideBar : true}
    }

    render() {
        let props = this.props;
        let dbName = props.dbName;

        let params = parseParams(props.location.search);
        let auth = this.props.auth;

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


        let groupAttr = extractGroupBy(parseParams(props.location.search));
        let groupOptions = props.schema.attributes

            // FIXME find declarative way to handle types that can support grouping
            .filter(attr => attr.type.tag == Types.ENUM  || attr.type.tag ==  Types.BOOLEAN)
            .map(attr => (
                {value:attr.name,
                    text:attrLabel(attr)} as DropdownItemProps));

        groupOptions = [{value:null, text:_.empty_group_by} as DropdownItemProps].concat(groupOptions);

        let groupByDropdown = <Dropdown inline title={_.group_by}
                button className="icon" icon="plus square outline"
                labeled placeholder={_.group_by}
                options={groupOptions}
                value={groupAttr}
                onChange={(e, update) =>
                    goTo(props, updatedGroupBy(update.value as string))} />

        let sortByDropdown = <SortPopup {...props} />

        let UpdateSchemaButton = auth.hasRight(AccessRight.ADMIN) &&
            <SafeClickWrapper trigger={
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


        let attributeDisplayButton = <SafePopup position="bottom left" trigger={
            <Button icon="unhide"
                    title={_.select_columns} />} >
            <AttributeDisplayComponent
                {...props}
                schema = {props.schema}
            />
        </SafePopup>

        return <>
            <div style={{display:"table", width:"100%", padding:"1em"}}>
                <div style={{display:"table-cell", width:"100%"}}>

                    <div style={{float:"right"}} className="no-print" >
                        <SearchComponent schema={props.schema} />
                        { DownloadButton }
                    </div>

                    <div className="no-print">
                        { addItemButton(this.props) }
                        { UpdateSchemaButton }
                    </div>

                    <div className="no-print">
                        { viewTypeButtons } &nbsp;
                        { sortByDropdown }
                        { groupByDropdown}
                        { <FiltersPopup {...props} schema={this.props.schema} /> }
                        &nbsp;
                        { attributeDisplayButton }
                    </div>

                    { groupedRecords(groupAttr, props, viewType) }
                </div>
            </div>
        </>
    }
}


// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, routerProps?: RouteComponentProps<{}>) : RecordsProps => {

    // Flatten map of records
    let records = mapMap(state.items,(key, item) => item) as Map[];

    // Apply search and sorting
    let params = parseParams(routerProps.location.search);
    records = applySearchAndFilters(records, params, state.schema);

    return {
        schema: state.schema,
        records: records}
};

// connect to redux
export let RecordsPage = connectPage(mapStateToProps)(RecordsPageInternal);

