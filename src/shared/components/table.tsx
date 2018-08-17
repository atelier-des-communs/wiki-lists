import {extractSort} from "../views/sort";
import {parseParams, updatedQuery} from "../utils";
import {RouteComponentProps, withRouter} from "react-router"
import {_} from "../i18n/messages";
import {deleteItem} from "../rest/client";
import {CollectionEventProps, ReduxProps} from "./common";
import * as React from "react";
import {Button, Icon, Table} from 'semantic-ui-react'
import {SafeClickWrapper} from "./utils/ssr-safe";
import {SchemaDialog} from "./schema-dialog";
import {EditDialog} from "./edit-dialog";
import {ValueHandler} from "./type-handlers/editors";
import {extractGroupBy} from "../views/group";
import {Attribute} from "../model/types";

type TableProps = ReduxProps & CollectionEventProps & RouteComponentProps<{}>;

/** Switch sort order upon click, do it via search parameters / location */
function onHeaderClick(props: RouteComponentProps<{}>, attr:string) {

    // Parse query string for current sort
    let sort = extractSort(parseParams(props.location.search));

    // Same key ? => toggle sort order
    let newAsc = (sort && sort.key == attr) ? ! sort.asc  : true;

    // Update current query with new sort
    props.history.push(updatedQuery(
        props.location.search,
        {sort: attr + "." + (newAsc ? "asc" : "desc")}))
}

const TableComponent: React.SFC<TableProps> = (props) => {

    let attrs = props.schema.attributes;

    let groupBy = extractGroupBy(parseParams(props.location.search));

    // Filter out group-by column
    let filterColumns = (attr:Attribute) => attr.name != groupBy;

    // First header cell : the menu toolbox
    let columnsHeader = <Table.HeaderCell collapsing key="menu" >
        <SafeClickWrapper trigger={<Button icon="columns" size="mini" basic compact />} >
            <SchemaDialog
                onUpdate={props.onUpdateSchema}
                schema={props.schema}
            />
        </SafeClickWrapper>
    </Table.HeaderCell>;

    let sort = extractSort(parseParams(props.location.search));

    // List of fields as table header
    let headers = attrs.filter(filterColumns).map(attr =>
        <Table.HeaderCell
            key={attr.name}
            style={{cursor:"pointer"}}
            onClick={ () => onHeaderClick(props, attr.name)}
        >
            { attr.name }

            { sort && sort.key == attr.name && <Icon
                name={sort.asc ? "sort up" : "sort down"}
                style={{float:"right"}} />}

        </Table.HeaderCell>);

    const rows  = props.records.map(record =>
        <Table.Row key={record["_id"] as string}>
            <Table.Cell collapsing key="actions" >
                <Button.Group basic>
                    <SafeClickWrapper trigger={ <Button icon="edit" size="mini" basic compact /> }>
                        <EditDialog
                            value={record}
                            schema={props.schema}
                            create={false}
                            onUpdate={props.onUpdate}  />
                    </SafeClickWrapper>
                    <Button icon="delete" size="mini" basic compact onClick={() => {
                        if (confirm(_.confirm_delete)) {
                            props.onDelete(record._id);
                        }
                    }} />
                </Button.Group>
            </Table.Cell>
            {attrs.filter(filterColumns).map(attr =>
                <Table.Cell key={attr.name} >
                    <ValueHandler
                        editMode={false}
                        type={attr.type}
                        value={ record[attr.name] } />
                </Table.Cell>)}
        </Table.Row>);

    return <Table celled style={{marginTop:"1em", marginRight:"1em"}} >
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

export const ConnectedTableComponent = withRouter<ReduxProps & CollectionEventProps>(TableComponent);

