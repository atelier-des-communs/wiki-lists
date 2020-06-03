/* Display several records with Type : table */
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {getDbName, goTo, goToResettingPage, parseParams} from "../../utils";
import {Link} from 'react-router-dom'
import {RouteComponentProps, withRouter} from "react-router"
import {DbPathParams, DbProps, RecordsProps, UpdateActions} from "../common-props";
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

type TableProps = RecordsProps & DbProps & UpdateActions & RouteComponentProps<DbPathParams> & GlobalContextProps;


class _TableComponent extends React.Component<TableProps> {

    constructor(props : TableProps) {
        super(props);
    }

    /** Switch sort order upon click, do it via search parameters / location */
    onHeaderClick(props: RouteComponentProps<{}>, attr:string) {

        // Parse query string for current sort
        let sort = extractSort(parseParams(props.location.search));

        // Same key ? => toggle sort order
        let newAsc = (sort && sort.key == attr) ? ! sort.asc  : true;

        let newSort:ISort = {key:attr, asc:newAsc};
        let params = serializeSort(newSort);
        goToResettingPage(props, params);
    }

    render() {
        let props = this.props;

        let attrs = props.db.schema.attributes;
        let queryParams = parseParams(props.location.search);
        let sort = extractSort(queryParams);
        let _ = props.messages;

        let filterAttributeFunc = filterAttribute(props, props.db.schema, "summary");

        // First header cell : the menu toolbox
        let columnsHeader = <Table.HeaderCell className="no-print" collapsing key="menu" >
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
                props.config,
                getDbName(props),
                id);};


        /* Column headers, for each attribute */
        let headers = attrs.filter(filterAttributeFunc).map(attr => {

            let sorted = sort && sort.key == attr.name;

            return <Table.HeaderCell
                key={attr.name}
                className="hoverable"
                style={{cursor:"pointer"}}
                onClick={() => this.onHeaderClick(props, attr.name)}
                sorted={sorted ? (sort.asc ? "ascending" : "descending"): null} >


                { ellipsis(attrLabel(attr, _)) }

            </Table.HeaderCell>
        });

        /* Table rows */
        const rows  = props.records.map(record =>

            <Table.Row key={record["_id"] as string} >

                <Table.Cell collapsing key="actions" className="no-print" >
                    <EditButtons {...props} record={record} />
                </Table.Cell>

                {attrs.filter(filterAttributeFunc).map(attr => {
                    return <Table.Cell key={attr.name} >
                        <ValueHandler
                            {...props}
                            editMode={false}
                            type={attr.type}
                            value={record[attr.name]}/>
                    </Table.Cell>
                })}

            </Table.Row>);

        /** Whole table */
        return <Table sortable celled >
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
}

export const TableComponent = withRouter(withGlobalContext(_TableComponent));

