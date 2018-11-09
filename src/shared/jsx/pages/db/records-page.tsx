/* Main page displaying a single collection, with sorting, filtering, grouping */
import * as React from 'react';
import {Button, Dropdown, Header} from 'semantic-ui-react'
import {EditDialog} from "../../dialogs/edit-dialog";
import {attributesMap, Types} from "../../../model/types";
import {goTo, mapMap, parseParams} from "../../../utils";
import {SafeClickWrapper, SafePopup} from "../../utils/ssr-safe";
import {DispatchProp} from "react-redux";
import {createAddItemAction, IState} from "../../../redux/index";

import {RouteComponentProps} from "react-router"
import {Record} from "../../../model/instances";
import {FilterSidebar, FiltersPopup, SearchComponent} from "../../type-handlers/filters";
import {applySearchAndFilters, clearFiltersOrSearch, hasFiltersOrSearch} from "../../../views/filters";
import {DbPathParams, RecordsProps, RecordsPropsOnly, ReduxEventsProps} from "../../common-props";
import {ConnectedTableComponent} from "../../components/table";
import {extractGroupBy, groupBy, updatedGroupBy} from "../../../views/group";
import {Collapsible} from "../../utils/collapsible";
import {SchemaDialog} from "../../dialogs/schema-dialog";
import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../../../api";
import {DropdownItemProps} from "semantic-ui-react/dist/commonjs/modules/Dropdown/DropdownItem"
import {SortPopup} from "../../components/sort-popup";
import {extractViewType, serializeViewType, ViewType} from "../../../views/view-type";
import {CardsComponent} from "../../components/cards";
import {ValueHandler} from "../../type-handlers/editors";
import {AttributeDisplayComponent} from "../../components/attribute-display";
import {GlobalContextProps} from "../../context/global-context";
import {AccessRight, hasRight} from "../../../access";
import {attrLabel} from "../../utils/utils";
import {connectComponent} from "../../context/redux-helpers";


type RecordsPageProps =
    GlobalContextProps &
    RecordsProps & // mapped from redux react
    RouteComponentProps<DbPathParams> &
    ReduxEventsProps &
    DispatchProp<any>;


function groupedRecords(groupAttr: string, props:RecordsPageProps, viewType: ViewType) {

    let attrMap = attributesMap(props.schema);
    let _ = props.messages;

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
            <div style={{marginTop:"1em", cursor:"pointer"}}>
                <Collapsible trigger={open =>
                    <div style={{marginTop:"1em"}} >
                    <Button circular compact size="small" icon={open ? "chevron down" : "chevron right"} />
                    <Header
                        as="span"
                        size="medium" >

                        {attrLabel(attr)} :
                            <ValueHandler
                                {...props}
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
    let _ = props.messages;
    return hasRight(props, AccessRight.EDIT) && <SafeClickWrapper  trigger={
        <Button primary style={{marginBottom:"1em"}} icon="plus" content={_.add_item} />
    }>
        <EditDialog
            {...props}
            record={{}}
            schema={props.schema}
            create={true}
            onUpdate={props.onCreate}  />
    </SafeClickWrapper>
}


class RecordsPageInternal extends React.Component<RecordsPageProps> {

    state : {
        filtersSidebar : boolean;
    }

    constructor(props:RecordsPageProps) {
        super(props);
        this.state = {filtersSidebar:true};
    }

    toggleFilterSidebar() {
       this.setState({filtersSidebar:!this.state.filtersSidebar});
    }

    groupByButton(groupAttr:string) {
        let props = this.props;
        let _ = props.messages;

        let groupOptions = props.schema.attributes

        // FIXME find declarative way to handle types that can support grouping
            .filter(attr => attr.type.tag == Types.ENUM  || attr.type.tag ==  Types.BOOLEAN)
            .map(attr => (
                {value:attr.name,
                    text:attrLabel(attr)} as DropdownItemProps));

        // No attributes elligible for grouping ? => show nothing
        if (groupOptions.length == 0) return null;

        groupOptions = [{value:null, text:_.empty_group_by} as DropdownItemProps].concat(groupOptions);

        return <Dropdown
            inline title={_.group_by}
            button className="icon" icon="plus square outline"
            labeled placeholder={_.group_by}
            options={groupOptions}
            value={groupAttr}
            onChange={(e, update) => goTo(props, updatedGroupBy(update.value as string))} />
    }

    render() {
        let props = this.props;
        let dbName = props.match.params.db_name;
        let _ = props.messages;

        let params = parseParams(props.location.search);
        let groupAttr = extractGroupBy(params);

        let xls_link =
            DOWNLOAD_XLS_URL.replace(":db_name", dbName)
            + props.location.search;
        let json_link =
            DOWNLOAD_JSON_URL.replace(":db_name", dbName)
            + props.location.search;

        let DownloadButton= <SafePopup  trigger={<Button icon="download" title={_.download} basic />} >
            <>
                <a href={xls_link}><b>Excel</b></a>
                <br/>
                <a href={json_link}><b>JSON</b></a>
            </>
            </SafePopup>;


        let sortByDropdown = <SortPopup {...props} />

        let UpdateSchemaButton = hasRight(props, AccessRight.ADMIN) &&
            <SafeClickWrapper trigger={
            <Button icon="configure"
                    color="teal"
                    content={_.edit_attributes} />} >
                <SchemaDialog
                    {...props}
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
            <Button
                icon="unhide"
                title={_.select_columns}
                content={_.select_columns} />} >
            <AttributeDisplayComponent
                {...props}
                schema = {props.schema}
            />
        </SafePopup>

        // Set html HEAD
        props.head.setTitle(props.match.params.db_name);

        let sideBarButton = (floated:"left" | "right" | null) =><Button
            compact
            size="mini"
            floated={floated}
            onClick={() => this.toggleFilterSidebar()}
            title={_.toggle_filters}
            icon={this.state.filtersSidebar ? "angle double left" : "angle double right"} />

        return <>

            <div style={{float:"right"}} className="no-print" >
                <SearchComponent {...props} />
                { DownloadButton }
            </div>

            <div className="no-print">
                { addItemButton(this.props) }
                { UpdateSchemaButton }
            </div>

            <div className="no-print">
                { viewTypeButtons } &nbsp;
                { sortByDropdown }
                { this.groupByButton(groupAttr) }
                { <FiltersPopup {...props} schema={this.props.schema} /> }
                &nbsp;
                { attributeDisplayButton }
            </div>

            <div>
                {this.state.filtersSidebar &&
                    <div className="no-print" style={{display: "table-cell", paddingTop: "1em", paddingRight:"1em"}}>
                        {sideBarButton("right")}
                        <FilterSidebar {...props} />
                    </div>
                }
                <div style={{display:"table-cell", paddingTop: "1em"}} >
                    {!this.state.filtersSidebar && sideBarButton(null)}
                    { groupedRecords(groupAttr, props, viewType) }
                </div>
            </div>
        </>

    }
}


// Filter data from Redux store and map it to props
const mapStateToProps =(state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : RecordsPropsOnly => {

    // Flatten map of records
    let records = mapMap(state.items || {},(key:string, item:Record) => item) as Record[];

    // Apply search and sorting
    let params = parseParams(props.location.search);
    records = applySearchAndFilters(records, params, state.dbDefinition.schema);

    return {records}
};

// Async fetch of data
function fetchData(props:GlobalContextProps & RouteComponentProps<DbPathParams>) : Promise<any> {
    let state = props.store.getState();
    if (state.items == null) {
        return props.dataFetcher
            .getRecords(props.match.params.db_name)
            .then((records) => {
                // FIXME "items" is not updated to {} when nothing is fetched
                for (let record of records) {
                    // Dispatch to redux
                    props.store.dispatch(createAddItemAction(record));
                }
            });
    }
    return null;
}

// Connect to Redux
export let RecordsPage = connectComponent(
    mapStateToProps,
    fetchData)(RecordsPageInternal);

