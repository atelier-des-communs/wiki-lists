/* Main page displaying a single collection, with sorting, filtering, grouping */
import * as React from 'react';
import {Button, Dropdown, Header, Responsive, Pagination} from 'semantic-ui-react'
import {EditDialog} from "../../dialogs/edit-dialog";
import {attributesMap, Types} from "../../../model/types";
import {goTo, intToStr, mapMap, mapValues, parseParams, strToInt} from "../../../utils";
import {SafeClickWrapper, SafePopup} from "../../utils/ssr-safe";
import {DispatchProp} from "react-redux";
import * as QueryString from "querystring";
import {RouteComponentProps} from "react-router"
import {Record} from "../../../model/instances";
import {FilterSidebar, FiltersPopup, SearchComponent} from "../../type-handlers/filters";
import {
    clearFiltersOrSearch,
    extractFilters,
    extractSearch,
    hasFiltersOrSearch, serializeSortAndFilters
} from "../../../views/filters";
import {DbPathParams, DbProps, PageProps, RecordsProps, ReduxEventsProps} from "../../common-props";
import {TableComponent} from "../../components/table";
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
import {GlobalContextProps, withGlobalContext} from "../../context/global-context";
import {AccessRight, hasRight} from "../../../access";
import {attrLabel} from "../../utils/utils";
import {
    createAddItemsAction,
    createUpdateCountAction,
    createUpdatePageAction,
    IState
} from "../../../redux";
import {connectComponent} from "../../context/redux-helpers";
import {ResponsiveButton} from "../../components/responsive";
import {safeStorage} from "../../utils/storage";
import {toAnnotatedJson} from "../../../serializer";
import {extractSort} from "../../../views/sort";
import {RecordsMap} from "./map";
import {AsyncDataComponent} from "../../async/async-data-component";
import stringify from "json-stringify-deterministic";


type RecordsPageProps =
    PageProps<DbPathParams> &
    DbProps &
    ReduxEventsProps &
    DispatchProp<any>;


// TODO : make it a setting
let ITEMS_PER_PAGE = 20;

interface GroupProps {
    viewType: ViewType,
    groupAttr: string
}


class AsyncSinglePage extends AsyncDataComponent<RecordsPageProps, RecordsProps> {

    fetchData(nextProps: RecordsPageProps, nextState: {}): Promise<RecordsProps> | RecordsProps {

        let props = this.props;
        let state = this.props.store.getState();
        let query = parseParams(this.props.location.search);
        let sort = extractSort(query);
        let search = extractSearch(query);
        let filters = extractFilters(state.dbDefinition.schema, query);

        // Sort and filter params, serialized
        let key = stringify(serializeSortAndFilters(sort, filters, search));

        let page : number = strToInt(query.page) || 1;

        if (key in state.pages && page in state.pages[key]) {
            // Synchronous result

            // Every record should be there
            // FIXME : still check it and fetch each record if missing ?
            let recordIds = state.pages[key][page];
            return {records : recordIds.map(id => state.items[id])};

        } else {

            // We need to fetch it !
            return props.dataFetcher.getRecords(
                props.match.params.db_name,
                filters, search, sort,
                (page -1) * ITEMS_PER_PAGE,
                ITEMS_PER_PAGE)
                .then((records) => {

                    // Update records by their id
                    props.store.dispatch(createAddItemsAction(records));

                    // Update page of indexes
                    let recordsIds = records.map(record => record._id);
                    props.store.dispatch(createUpdatePageAction(key, page, recordsIds));

                    return {records};
                });
        }
    }

    render() {

        if (this.asyncData == null) {
            // FIXME Loading ?
            return null
        }

        let allRecords = this.asyncData.records;
        let props = this.props;

        // FIXME extract once only
        let params = parseParams(props.location.search);
        let viewType = extractViewType(params);


        let db = props.db;
        let attrMap = attributesMap(db.schema);
        let _ = props.messages;

        // Switch on type of view
        let ViewTypeSwitch = (recordsProps: { records: Record[] }) => {
            switch (viewType) {
                case ViewType.TABLE :
                    return <TableComponent {...props} {...recordsProps} />
                case ViewType.CARDS:
                    return <CardsComponent {...props} {...recordsProps} />;
                default :
                    throw new Error(`unsupported view type : ${viewType}`)
            }
        };

        const NothingHere = () => <div style={{textAlign: "center"}}>
            <Header>{_.no_element}</Header>

            <AddItemButton {...props} />

            {hasFiltersOrSearch(db.schema, props) &&
            <Button icon="delete"
                    onClick={() => clearFiltersOrSearch(db.schema, props)}>
                {_.clear_filters}
            </Button>}
        </div>

        let Records = (props: { records: Record[] }) => {
            if (!props.records) {
                // FIXME : loading instead ?
                return null;
            }
            return <div style={{marginTop: "1em", marginRight: "1em"}}>
                {props.records.length == 0 ?
                    <NothingHere/>
                    : <ViewTypeSwitch {...props} />}
            </div>
        };

        let groupAttr = extractGroupBy(params);

        // Grouping activated ? => display sections
        if (groupAttr) {

            let attr = attrMap[groupAttr];
            let sections = groupBy(allRecords, attr).map(group =>
                <div style={{marginTop: "1em"}}>
                    <Collapsible trigger={open =>
                        <div style={{marginTop: "1em", display: "table-cell", cursor: "pointer"}}>
                            <Button circular compact size="small" icon={open ? "chevron down" : "chevron right"}/>
                            <Header
                                as="span"
                                size="medium">

                                {attrLabel(attr, _)} :
                                <ValueHandler
                                    {...props}
                                    type={attr.type}
                                    value={group.value}
                                    editMode={false}/>
                            </Header></div>}>

                        <Records records={group.records}/>

                    </Collapsible>
                </div>);

            return <>{
                sections.length == 0 ? <NothingHere/> : sections}
            </>
        } else {
            return <Records records={allRecords}/>;
        }
    }
}


interface CountProps {
    count : number;
}

export class AsyncPaging extends AsyncDataComponent<RecordsPageProps, CountProps> {

    fetchData(nextProps: RecordsPageProps, nextState: {}) {
        let props = this.props;
        let state = props.store.getState();
        let query = parseParams(props.location.search);
        let search = extractSearch(query);
        let filters = extractFilters(state.dbDefinition.schema, query);

        // filter params, serialized
        let key = stringify(serializeSortAndFilters(null, filters, search));

        if (key in state.counts) {
            // Synchronous result
            return {count: state.counts[key]};
        } else {
            // Need fetch
            return props.dataFetcher.countRecords(
                props.match.params.db_name,
                filters, search)
                .then((count) => {
                    // Update state (cache)
                    props.store.dispatch(createUpdateCountAction(key, count));
                    return {count};
                })
        }
    }

    goToPage(pageNum : number | string) {
        if (typeof pageNum  != 'number') {
            pageNum = parseInt(pageNum);
        }
        goTo(this.props, {page: intToStr(pageNum)});
    }

    render() {
        if (this.asyncData == null) {
            return null;
        }

        let query = parseParams(this.props.location.search);
        let page : number = strToInt(query.page) || 1;

        let nbPages = Math.ceil(this.asyncData.count / ITEMS_PER_PAGE);

        if (nbPages > 1) {
            return <Pagination
                totalPages={nbPages}
                activePage={page}
                style={{marginTop:"1em"}}
                onPageChange={(e, {activePage}) => {this.goToPage(activePage)}}
            />
        } else {
            return null;
        }
    };
}

function AddItemButton(props: RecordsPageProps) {
    let _ = props.messages;
    return hasRight(props, AccessRight.EDIT) &&
            <SafeClickWrapper
                trigger={onOpen =>
                    <Button
                        primary style={{marginBottom:"1em"}}
                        icon="plus" content={_.add_item}
                        onClick={onOpen}/>}
                render={onClose =>
                    <EditDialog
                        {...props}
                        record={{}}
                        schema={props.db.schema}
                        create={true}
                        onUpdate={props.onCreate}
                        close={onClose} />
                } >
            </SafeClickWrapper>
}

const SIDEBAR_LS_KEY = "filtersSidebar";


// Main component
class _RecordsPage extends React.Component<RecordsPageProps> {

    state : {
        filtersSidebar : boolean;
    }

    constructor(props:RecordsPageProps) {
        super(props);
        console.debug("Records page created");
        this.state = {filtersSidebar:safeStorage.getBool(SIDEBAR_LS_KEY, true)};
    }

    toggleFilterSidebar() {
        let newVal = !this.state.filtersSidebar;
        safeStorage.set(SIDEBAR_LS_KEY, newVal);
        this.setState({filtersSidebar:newVal});
    }

    render() {
        let props = this.props;
        let db = props.db;
        let dbName = props.match.params.db_name;
        let _ = props.messages;

        let xls_link =
            DOWNLOAD_XLS_URL.replace(":db_name", dbName)
            + props.location.search;
        let json_link =
            DOWNLOAD_JSON_URL.replace(":db_name", dbName)
            + props.location.search;

        let DownloadButton = () => <SafePopup  trigger={<Button icon="download" title={_.download} basic />} >
            <>
                <a href={xls_link}><b>Excel</b></a>
                <br/>
                <a href={json_link}><b>JSON</b></a>
            </>
            </SafePopup>;


        let SortByDropdown = () => <SortPopup {...props} schema={db.schema} />

        let UpdateSchemaButton = () => {
            if (!hasRight(props, AccessRight.ADMIN)) {
                return null;
            }
            return <SafeClickWrapper
                    trigger={onOpen =>
                        <ResponsiveButton icon="configure"
                                          color="teal"
                                          content={_.edit_attributes}
                                          onClick={onOpen} />}
                    render={onClose =>
                        <SchemaDialog
                            {...props}
                            onUpdateSchema={props.onUpdateSchema}
                            schema={db.schema}
                            close={onClose} />}
                    >
            </SafeClickWrapper>;
        };

        let setViewType = (viewType: ViewType) => {
            goTo(props, serializeViewType(viewType));
        };

        let params = parseParams(props.location.search);
        let groupAttr = extractGroupBy(params);

        let GroupByButton = () => {
            let props = this.props;
            let db = props.db;
            let _ = props.messages;

            let groupOptions = db.schema.attributes

            // FIXME find declarative way to handle types that can support grouping
                .filter(attr => attr.type.tag == Types.ENUM  || attr.type.tag ==  Types.BOOLEAN)
                .map(attr => (
                    {value:attr.name,
                        text:attrLabel(attr, _)} as DropdownItemProps));

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

        // FIXME : parse all this once
        let viewType = extractViewType(params);

        let ViewTypeButtons = () => <Button.Group basic>
            <Button icon="table"
                    title={`${_.view_type} : ${_.table_view}`}
                    active={viewType == ViewType.TABLE}
                    onClick={() => setViewType(ViewType.TABLE)} />
            <Button icon="grid layout"
                    title={`${_.view_type} : ${_.card_view}`}
                    active={viewType == ViewType.CARDS}
                    onClick={() => setViewType(ViewType.CARDS)}/>
        </Button.Group>;




        let AttributeDisplayButton = () => <SafePopup position="bottom left" trigger={
            <ResponsiveButton
                icon="unhide"
                title={_.select_columns}
                content={_.select_columns} />} >
            <AttributeDisplayComponent
                {...props}
                schema = {db.schema}
            />
        </SafePopup>;

        // Set html HEAD
        props.head.setTitle(db.label);
        props.head.setDescription(db.description);

        let SideBarButton = (props: {floated : "left" | "right" | null}) => <Button
            className="large-screen-only"
            compact
            size="mini"
            floated={props.floated}
            onClick={() => this.toggleFilterSidebar()}
            title={_.toggle_filters}
            icon={this.state.filtersSidebar ? "angle double left" : "angle double right"} />

        return <>

            <div style={{float: "right"}} className="no-print">
                <SearchComponent {...props} schema={db.schema} />
                <DownloadButton />
            </div>

            <div className="no-print">
                <UpdateSchemaButton/>
            </div>

            <div>


                <SortByDropdown />

                {
                    // <GroupByButton />
                }

                <FiltersPopup {...props} schema={db.schema}/>

                &nbsp;

                <AttributeDisplayButton/>
            </div>

            <div style={{display:"flex"}}>
                {this.state.filtersSidebar &&
                <div className="no-print large-screen-only"
                     style={{
                         paddingTop: "1em",
                         paddingRight: "1em"}}>
                    <SideBarButton floated={"right"} />
                    <FilterSidebar {...props} schema={db.schema} />
                </div>
                }

                <div style={{flexGrow:1, paddingTop: "1em"}}>

                    <div className="no-print" style={{ marginBottom: "0.5em" }} >
                        {!this.state.filtersSidebar && <SideBarButton floated={null} />}
                        <AddItemButton {...this.props} />
                        <ViewTypeButtons />
                    </div>

                    <RecordsMap {...props} />

                    <AsyncPaging {...props} />

                        <AsyncSinglePage {...props} />

                    <AsyncPaging {...props} />

                </div>
            </div>
        </>;

    }
}

// Connect to Redux
export let RecordsPage = withGlobalContext(_RecordsPage);

