/* Display several records with Type : table */
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {goTo, parseParams} from "../../utils";
import {Link} from 'react-router-dom'
import {RouteComponentProps, withRouter} from "react-router"
import {DbPathParams, RecordsProps, ReduxEventsProps} from "../common-props";
import * as React from "react";
import {Button, Table} from 'semantic-ui-react'
import {SafePopup} from "../utils/ssr-safe";
import {ValueHandler} from "../type-handlers/editors";
import {extractFilters} from "../../views/filters";
import {AttributeDisplayComponent} from "./attribute-display";
import {attrLabel, ellipsis, filterAttribute} from "../utils/utils";
import {EditButtons} from "./edit-button";
import {singleRecordLink} from "../../api";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {AccessRight, hasRight} from "../../access";

type TableProps = RecordsProps & ReduxEventsProps & RouteComponentProps<DbPathParams> & GlobalContextProps;

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

    let attrs = props.db.schema.attributes;
    let queryParams = parseParams(props.location.search);
    let sort = extractSort(queryParams);
    let filters = extractFilters(props.db.schema, queryParams);
    let _ = props.messages;

    let filterAttributeFunc = filterAttribute(props, props.db.schema);

    // First header cell : the menu toolbox
    let columnsHeader = hasRight(props, AccessRight.EDIT) && <Table.HeaderCell className="no-print" collapsing key="menu" >
        <SafePopup position="bottom left" trigger={
            <Button
                icon="columns"
                size="mini"
                title={_.select_columns}
                basic compact />} >
           <AttributeDisplayComponent
               {...props}
                schema = {props.db.schema}
           />
        </SafePopup>
    </Table.HeaderCell>;

    let recordUrl = (id:string) => {
        return singleRecordLink(
            props.match.params.db_name,
            id);};


    /* Column headers, for each attribute */
    let headers = attrs.filter(filterAttributeFunc).map(attr => {

        let sorted = sort && sort.key == attr.name;

        return <Table.HeaderCell
            key={attr.name}
            className="hoverable"
            style={{cursor:"pointer"}}
            onClick={() => onHeaderClick(props, attr.name)}
            sorted={sorted ? (sort.asc ? "ascending" : "descending"): null} >


            { ellipsis(attrLabel(attr)) }

        </Table.HeaderCell>
    });

    /* Table rows */
    const rows  = props.records.map(record =>

        <Table.Row key={record["_id"] as string}>

            {hasRight(props, AccessRight.EDIT) &&
            <Table.Cell collapsing key="actions" className="no-print" >
                <EditButtons {...props} record={record} />
            </Table.Cell>}

            {attrs.filter(filterAttributeFunc).map(attr => {

                let valueEl = <ValueHandler
                    {...props}
                    editMode={false}
                    type={attr.type}
                    value={record[attr.name]}/>;


                return <Table.Cell key={attr.name} >
                    {
                        /* Attribute part of the name ? => wrap it in a link */
                        attr.isName ?
                        <Link to={recordUrl(record._id)} >
                            {valueEl}
                        </Link> :
                            valueEl
                    }

                </Table.Cell>
            })}

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

export const ConnectedTableComponent = withRouter(withGlobalContext(TableComponent));

