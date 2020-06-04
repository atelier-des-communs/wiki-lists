/* Main page displaying a single collection, with sorting, filtering, grouping */
import * as React from 'react';
import {Button, Container, Dropdown, Header, Message, Pagination, Responsive} from 'semantic-ui-react'
import {EditDialog} from "../../dialogs/edit-dialog";
import {attributesMap, Types} from "../../../model/types";
import {getDbName, goTo, goToUrl, humanReadableCount, intToStr, parseBool, parseParams, strToInt} from "../../../utils";
import {ButtonWrapper, SafeClickWrapper, SafePopup} from "../../utils/ssr-safe";
import {Record} from "../../../model/instances";
import {FilterSidebar, FiltersPopup, getFiltersComp} from "../../type-handlers/filters";
import {
    clearFiltersOrSearch,
    extractFilters,
    extractSearch,
    hasFiltersOrSearch,
    serializeSortAndFilters
} from "../../../views/filters";
import {DbPathParams, DbProps, PageProps, RecordsProps, UpdateActions} from "../../common-props";
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
import {withGlobalContext} from "../../context/global-context";
import {AccessRight, hasRight} from "../../../access";
import {attrLabel} from "../../utils/utils";
import {createAddItemsAction, createUpdateCountAction, createUpdatePageAction} from "../../../redux";
import {ResponsiveButton} from "../../components/responsive";
import {extractSort} from "../../../views/sort";
import {RecordsMap} from "./map";
import {AsyncDataComponent} from "../../async/async-data-component";
import stringify from "json-stringify-deterministic";
import {withAsyncImport} from "../../async/async-import-component";
import {DbPageProps} from "./db-page-switch";
import {CloseableDialog} from "../../dialogs/common-dialog";
import localStorage from "local-storage";

type RecordsPageProps =
    PageProps<DbPathParams> &
    DbProps &
    UpdateActions;

// TODO : make it a setting
let ITEMS_PER_PAGE = 20;

interface GroupProps {
    viewType: ViewType,
    groupAttr: string
}

const HIDE_DESCRIPTION_LS_KEY = (dbname:string) => `${dbname}.hide_desc`;

class AsyncSinglePage extends AsyncDataComponent<RecordsPageProps, RecordsProps> {

    fetchData(nextProps: RecordsPageProps, nextState: {}): Promise<RecordsProps> | RecordsProps {

        let state = nextProps.store.getState();
        let query = parseParams(nextProps.location.search);
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

            // We need to fetch it yet !
            return nextProps.dataFetcher.getRecords(
                getDbName(nextProps),
                filters, search, sort,
                (page -1) * ITEMS_PER_PAGE,
                ITEMS_PER_PAGE)
                .then((records) => {

                    // Update records by their id
                    nextProps.store.dispatch(createAddItemsAction(records));

                    // Update page of indexes
                    let recordsIds = records.map(record => record._id);
                    nextProps.store.dispatch(createUpdatePageAction(key, page, recordsIds));

                    return {records};
                });
        }
    }

    renderLoaded() {

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
                    return <TableComponent {...props} {...recordsProps} />;
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
        </div>;

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

        let state = nextProps.store.getState();
        let query = parseParams(nextProps.location.search);
        let search = extractSearch(query);
        let filters = extractFilters(state.dbDefinition.schema, query);

        // filter params, serialized
        let key = stringify(serializeSortAndFilters(null, filters, search));

        if (key in state.counts) {
            // Synchronous result
            return {count: state.counts[key]};
        } else {
            // Need fetch
            return nextProps.dataFetcher.countRecords(
                getDbName(nextProps),
                filters, search)
                .then((count) => {
                    // Update state (cache)
                    nextProps.store.dispatch(createUpdateCountAction(key, count));
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

    renderLoaded() {
        if (this.asyncData == null) {
            return null;
        }

        let _ = this.props.messages;
        let query = parseParams(this.props.location.search);
        let page : number = strToInt(query.page) || 1;

        let nbPages = Math.ceil(this.asyncData.count / ITEMS_PER_PAGE);

        if (nbPages > 1) {
            let Paging = () =>
                <div style={{marginTop:"0.5em"}}>
                    <Pagination
                        size='small'
                        compact
                        boundaryRange={0}
                        firstItem={null}
                        lastItem={null}
                        siblingRange={1}
                        totalPages={nbPages}
                        activePage={page}
                        onPageChange={(e, {activePage}) => {this.goToPage(activePage)}} />

                <span style={{color:"gray"}}>
                    &nbsp;{humanReadableCount(this.asyncData.count)} {_.elements}
                </span>
            </div>;

            return <>
                    <Paging />
                        {this.props.children}
                    <Paging />
                </>;
        } else {
            return <>
                {this.props.children}
            </>;
        }
    };
}

function AddItemButton(props: RecordsPageProps) {
    let _ = props.messages;
    return hasRight(props, AccessRight.EDIT) &&
        <ButtonWrapper
            primary style={{marginBottom:"1em"}}
            icon="plus" content={_.add_item}
            render={onClose =>
            <EditDialog
                {...props}
                record={{}}
                schema={props.db.schema}
                create={true}
                onUpdate={props.onCreate}
                close={onClose} /> } />
}

const FILTER_SIDEBAR_LS_KEY = (dbname:string) => `${dbname}.filtersSidebar`;

const AsyncAddAlertDialog= withAsyncImport<DbPageProps & CloseableDialog, {}>(() => import("../../dialogs/alert-dialog").then(module => module.AddAlertDialog));

// Main component
class _RecordsPage extends React.Component<RecordsPageProps> {


    constructor(props:RecordsPageProps) {
        super(props);
        console.debug("Records page created");
    }

    toggleFilterSidebar() {
        let newVal = !parseBool(localStorage(FILTER_SIDEBAR_LS_KEY(getDbName(this.props))));
        localStorage(FILTER_SIDEBAR_LS_KEY(getDbName(this.props)), newVal);
        this.setState({});
    }

    hideDescription() {
        localStorage(HIDE_DESCRIPTION_LS_KEY(getDbName(this.props)), true);
        // Refresh
        this.setState({});
    }

    render() {
        let props = this.props;
        let db = props.db;
        let dbName = getDbName(props);
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

        let AddAlertButton = () =>
            <ButtonWrapper
                size="small"
                color="teal"
                icon="bell"
                content="Recevoir des alertes par email"
                render={onClose =>
                    <AsyncAddAlertDialog {...props} close={onClose} />} />;

        let SortByDropdown = () => <SortPopup {...props} schema={db.schema} />;

        console.debug("hideSidebar", localStorage(FILTER_SIDEBAR_LS_KEY(dbName)));
        let showSideBar = !parseBool(localStorage(FILTER_SIDEBAR_LS_KEY(dbName)));

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
        };

        // FIXME : parse all this once
        let viewType = extractViewType(params);

        let ViewTypeButtons = () => <Button.Group basic style={{marginRight:"10px"}}>
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
            compact
            size="mini"
            floated={props.floated}
            onClick={() => this.toggleFilterSidebar()}
            title={_.toggle_filters}
            icon={showSideBar ? "angle double left" : "angle double right"} />;


        let communeFilter = getFiltersComp(this.props).filter(({attr}) => attr.name == "commune")[0];


        let showDescription = !parseBool(localStorage(HIDE_DESCRIPTION_LS_KEY(dbName)));

        return <>

            {/*<p dangerouslySetInnerHTML={{__html:db.instructions}} /> */}

            {showDescription && <Container>

                <Message>

                    <p>
                        <Button
                            basic compact size="small"
                            icon="close" floated="right" title={_.hide}
                            style={{zIndex:100}}
                            onClick={() => this.hideDescription() }/>

                        Ce site est une interface ergonomique à la base de
                        données nationale des permis de construire <a href="https://www.data.gouv.fr/fr/datasets/base-des-permis-de-construire-sitadel/"><b>Sitadel</b></a>.
                        <br/>
                        Ce service est une initiative personnelle, visant à faciliter la veille des citoyens sur les projets immobiliers.
                        <br/>
                        <Button compact size="mini" content="En savoir plus" onClick={() => goToUrl(props, "/about")} />
                    </p>
                </Message>
            </Container> }

            {/** <DownloadButton /> */}

            <div className="no-print">
                <UpdateSchemaButton/>
            </div>

            { /** <div>

                {
                    // <GroupByButton />
                }

                <FiltersPopup {...props} schema={db.schema}/>

                &nbsp;

                <AttributeDisplayButton/>

                <SearchComponent {...props} schema={db.schema} />

            </div>
             **/}

             <div >
                 <div style={{display:"inline-block"}} className="small-margin">
                     <b>Votre commune</b>
                 </div>

                <div style={{display:"inline-block"}} className="small-margin">
                    <div style={{display:"flex"}}>
                        {communeFilter.component}
                        {communeFilter.resetButton}
                    </div>
                </div>

                 <Responsive {...Responsive.onlyMobile}>
                    <div style={{display:"inline-block"}} className="small-margin" >
                        <FiltersPopup {...props} />
                    </div>
                 </Responsive>

                 <div style={{display:"inline-block"}} className="small-margin" >
                    <AddAlertButton />
                 </div>
             </div>

            <div style={{display:"flex"}}>

                {showSideBar && <Responsive minWidth={Responsive.onlyTablet.minWidth} >
                    <div className="no-print" style={{paddingTop: "1em", paddingRight: "1em", maxWidth:"230px"}}>
                        <SideBarButton floated={"right"} />
                        <FilterSidebar {...props} />
                    </div>
                </Responsive>}

                <div style={{flexGrow:1, paddingTop: "1em"}}>

                    <div className="no-print" style={{ marginBottom: "0.5em" }} >
                        {!showSideBar && <SideBarButton floated={null} />}
                        <AddItemButton {...this.props} />
                    </div>

                    <RecordsMap {...props} />

                    <div style={{marginTop:"1em"}}>

                        <ViewTypeButtons />

                        <SortByDropdown />

                        <AsyncPaging {...props} >
                            <AsyncSinglePage {...props} />
                        </AsyncPaging>

                    </div>

                </div>
            </div>;
       </>
    }
}

// Connect to Redux
export let RecordsPage = withGlobalContext(_RecordsPage);

