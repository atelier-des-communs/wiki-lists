/* Main page displaying a single collection, with sorting, filtering, grouping */
import * as React from 'react';
import {Button, Dropdown, Header, Responsive} from 'semantic-ui-react'
import {EditDialog} from "../../dialogs/edit-dialog";
import {attributesMap, EnumType, Types} from "../../../model/types";
import {goTo, mapMap, mapValues, parseParams} from "../../../utils";
import {SafeClickWrapper, SafePopup} from "../../utils/ssr-safe";
import {DispatchProp} from "react-redux";

import {RouteComponentProps} from "react-router"
import {Record} from "../../../model/instances";
import {FilterSidebar, FiltersPopup, SearchComponent} from "../../type-handlers/filters";
import {applySearchAndFilters, clearFiltersOrSearch, hasFiltersOrSearch} from "../../../views/filters";
import {DbPathParams, PageProps, RecordsProps, RecordsPropsOnly, ReduxEventsProps} from "../../common-props";
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
import {AccessRight, hasDbRight} from "../../../access";
import {admin_color, attrLabel} from "../../utils/utils";
import {createAddItemAction, IState} from "../../../redux";
import {connectComponent} from "../../context/redux-helpers";
import {ResponsiveButton} from "../../components/responsive";
import {safeStorage} from "../../utils/storage";
import {toAnnotatedJson} from "../../../serializer";
import {fromPairs} from "lodash";


type RecordsPageProps =
    PageProps<DbPathParams> &
    RecordsProps & // mapped from redux react
    ReduxEventsProps &
    DispatchProp<any>;


function groupedRecords(groupAttr: string, props:RecordsPageProps, viewType: ViewType) {

    let db = props.db;
    let attrMap = attributesMap(db.schema);
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
        {hasFiltersOrSearch(db.schema, props) &&
        <Button icon="delete"
                onClick={() => clearFiltersOrSearch(db.schema, props)} >
            {_.clear_filters}
        </Button>}
    </div>

    let recordsComponent = (records: Record[]) => {
        return <div style={{marginTop:"1em", marginRight:"1em"}}>
            {records.length == 0 ? nothingHere
                : recordsSwitch(records)}
        </div>
    };

    // Grouping activated ? => display sections
    if (groupAttr) {

        let attr = attrMap[groupAttr];
        let groups = groupBy(props.records, attr);
        let sections = groups.map(group =>
            <div style={{marginTop:"1em"}}>
                <Collapsible trigger={open =>
                    <div style={{marginTop:"1em", display:"table-cell", cursor:"pointer"}} >
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
    let fields = props.db.schema.attributes.filter(attr => !attr.system).map(attr => ([attr.name, null]));
    let newRecord = fromPairs(fields);
    return hasDbRight(props.db, props.user, AccessRight.ADD) && <SafeClickWrapper  trigger={
        <Button primary style={{marginBottom:"1em"}} icon="plus" content={_.add_item} />
    }>
        <EditDialog
            {...props}
            record={newRecord}
            schema={props.db.schema}
            create={true}
            onUpdate={props.onCreate}  />
    </SafeClickWrapper>
}

const SIDEBAR_LS_KEY = "filtersSidebar";

class RecordsPageInternal extends React.Component<RecordsPageProps> {

    state : {
        filtersSidebar : boolean;
    }

    constructor(props:RecordsPageProps) {
        super(props);
        this.state = {filtersSidebar:safeStorage.getBool(SIDEBAR_LS_KEY, true)};
    }

    toggleFilterSidebar() {
        let newVal = !this.state.filtersSidebar;
        safeStorage.set(SIDEBAR_LS_KEY, newVal);
        this.setState({filtersSidebar:newVal});
    }

    groupByButton(groupAttr:string) {
        let props = this.props;
        let db = props.db;
        let _ = props.messages;

        let groupOptions = db.schema.attributes

        // FIXME find declarative way to handle types that can support grouping
            .filter(attr => (attr.type.tag == Types.ENUM && !((attr.type as EnumType).multi)) || attr.type.tag ==  Types.BOOLEAN)
            .map(attr => (
                {value:attr.name,
                    text:attrLabel(attr)} as DropdownItemProps));

        // No attributes elligible for grouping ? => show nothing
        if (groupOptions.length == 0) return null;

        groupOptions = [{value:null, text:_.empty_group_by} as DropdownItemProps].concat(groupOptions);

        return <Dropdown
            inline title={_.group_by}
            button className="icon" icon="plus square outline"
            labeled
            placeholder={_.group_by}
            options={groupOptions}
            value={groupAttr}
            onChange={(e, update) => goTo(props, updatedGroupBy(update.value as string))} />
    }

    render() {
        let props = this.props;
        let db = props.db;
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


        let sortByDropdown = <SortPopup {...props} schema={db.schema} />

        let updateSchemaButton = hasDbRight(props.db, props.user, AccessRight.ADMIN) &&
            <SafeClickWrapper trigger={
            <ResponsiveButton icon="configure"
                    color={admin_color}
                    content={_.edit_attributes} />} >
                <SchemaDialog
                    {...props}
                    onUpdateSchema={props.onUpdateSchema}
                    schema={db.schema}
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
            <ResponsiveButton
                icon="unhide"
                title={_.select_columns}
                content={_.select_columns} />} >
            <AttributeDisplayComponent
                {...props}
                schema = {db.schema}
            />
        </SafePopup>

        // Set html HEAD
        props.head.setTitle(db.label);
        props.head.setDescription(db.description);

        let sideBarButton = (floated:"left" | "right" | null) =><Button
            className="large-screen-only"
            compact
            size="mini"
            floated={floated}
            onClick={() => this.toggleFilterSidebar()}
            title={_.toggle_filters}
            icon={this.state.filtersSidebar ? "angle double left" : "angle double right"} />

        return <>

            <div style={{float: "right"}} className="no-print">
                <SearchComponent {...props} schema={db.schema} />
                {DownloadButton}
            </div>

            <div className="no-print">
                {updateSchemaButton}
            </div>

            <div className="no-print" style={{marginBottom: "0.2em", marginTop: "0.2em"}}>
                <span className="inline-label mobile hidden">
                    {_.view_type}
                </span>
                {viewTypeButtons}
            </div>
            <div>
                <span className="inline-label mobile hidden">
                    {_.selection}
                </span>
                {sortByDropdown}
                {this.groupByButton(groupAttr)}
                {<FiltersPopup {...props} schema={db.schema}/>}
                &nbsp;
                {attributeDisplayButton}
            </div>

            <div style={{display:"flex"}}>
                {this.state.filtersSidebar &&
                <div className="wl-sidebar large-screen-only" >
                    {sideBarButton("right")}
                    <FilterSidebar {...props} schema={db.schema} />
                </div>
                }
                <div style={{
                    flexGrow:1,
                    paddingTop: "1em"}}>

                    <div className="no-print">
                        {!this.state.filtersSidebar && sideBarButton(null)}
                        {addItemButton(this.props)}
                    </div>
                    {groupedRecords(groupAttr, props, viewType)}
                </div>
            </div>
        </>;

    }
}


// Filter data from Redux store and map it to props
const mapStateToProps =(state : IState, props?: RouteComponentProps<{}> & GlobalContextProps) : RecordsPropsOnly => {

    // Flatten map of records
    let records = toAnnotatedJson( // Immutable object into live ones, with prototype
        mapValues(state.items || {}) as Record[]);


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
            .getRecords(props.match.params.db_name, props.user, props.messages)
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

