/* Display type : table */
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {getDbName, goTo, goToUrl, parseParams, updatedQuery} from "../../utils";
import {RouteComponentProps, withRouter} from "react-router"
import {_} from "../../i18n/messages";
import {deleteItem} from "../../rest/client";
import {CollectionEventProps, RecordsRouteProps, RecordsProps} from "./props";
import * as React from "react";
import {Button, Icon, Table} from 'semantic-ui-react'
import {SafeClickWrapper, SafePopup} from "../utils/ssr-safe";
import {SchemaDialog} from "../dialogs/schema-dialog";
import {EditDialog} from "../dialogs/edit-dialog";
import {ValueHandler} from "../type-handlers/editors";
import {extractGroupBy} from "../../views/group";
import {Attribute, StructType} from "../../model/types";
import {extractFilters} from "../../views/filters";
import {singleFilter} from "../type-handlers/filters";
import {AttributeDisplayComponent} from "./attribute-display";
import {AttributeDisplay, extractDisplays} from "../../views/display";
import {ellipsis, filterAttribute} from "../utils/utils";
import {Record} from "../../model/instances";
import {editButtons} from "./edit-button";
import {singleRecordLink} from "../../rest/api";
import {GlobalContext, GlobalContextProps, withGlobalContext} from "../context/context";
import {AccessRight} from "../../access";

type TableProps = RecordsProps & CollectionEventProps & RouteComponentProps<RecordsRouteProps> & GlobalContextProps;

/** Switch sort order upon click, do it via search parameters / location */
function onHeaderClick(props: RouteComponentProps<{}>, attr:string) {

    // Parse query string for current sort
    let sort = extractSort(parseParams(props.location.search));

    // Same key ? => toggle sort order
    let newAsc = (sort && sort.key == attr) ? ! sort.asc  : true;

    let newSort:ISort = {key:attr, asc:newAsc};
    let params = serializeSort(newSort);
    goTo(props, params);
}


const TableComponent: React.SFC<TableProps> = (props) => {

    let attrs = props.schema.attributes;
    let queryParams = parseParams(props.location.search);
    let sort = extractSort(queryParams);
    let filters = extractFilters(props.schema, queryParams);

    let filterAttributeFunc = filterAttribute(props, props.schema);
    let auth = props.global.auth;

    // First header cell : the menu toolbox
    let columnsHeader = auth.hasRight(AccessRight.EDIT) && <Table.HeaderCell className="no-print" collapsing key="menu" >
        <SafePopup position="bottom left" trigger={
            <Button
                icon="unhide"
                size="mini"
                title={_.select_columns}
                basic compact />} >
           <AttributeDisplayComponent
               {...props}
                schema = {props.schema}
           />
        </SafePopup>
    </Table.HeaderCell>;

    let goToRecord = (id:string) => {
        goToUrl(props, singleRecordLink(getDbName(props), id));
    }


    /* Column headers, for each attribute */
    let headers = attrs.filter(filterAttributeFunc).map(attr => {

        let sorted = sort && sort.key == attr.name;
        let filter = filters[attr.name];


        // May be null if filter not supported for this type
        let filterComp = singleFilter(props, attr, filter);

        return <Table.HeaderCell
            key={attr.name}
            style={{cursor:"pointer"}}
            onClick={() => onHeaderClick(props, attr.name)}
            sorted={sorted ? (sort.asc ? "ascending" : "descending"): null} >
            
            { filterComp &&
            <div style={{float:"right"}}>
                <SafePopup position="bottom right" wide="very" trigger={
                   <Button
                       size="mini" className={filter ? "shy" : "super-shy-th"} compact
                       icon="filter"
                       color={filter ? "blue" : null}
                       onClick={(e:any) => e.stopPropagation()}/> }>
                    {filterComp}
                </SafePopup>
            </div>}

            { ellipsis(attr.name) }

        </Table.HeaderCell>
    });

    /* Table rows */
    const rows  = props.records.map(record =>

        <Table.Row key={record["_id"] as string}>

            {auth.hasRight(AccessRight.EDIT) &&
            <Table.Cell collapsing key="actions" className="no-print" >
                {editButtons(record, props, props.schema, auth)}
            </Table.Cell>}

            {attrs.filter(filterAttributeFunc).map(attr =>
                <Table.Cell key={attr.name}
                            style={{cursor:"pointer"}}
                onClick={() => goToRecord(record._id)}>
                    <ValueHandler
                        editMode={false}
                        type={attr.type}
                        value={record[attr.name]}/>
                </Table.Cell>
            )}

        </Table.Row>);

    /** Whole table */
    return <Table sortable celled  >
        <Table.Header>
            <Table.Row>
                {columnsHeader}
                {headers}
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {rows}
        </Table.Body>
    </Table>
}

export const ConnectedTableComponent = withRouter<RecordsProps & CollectionEventProps>(withGlobalContext(TableComponent));

