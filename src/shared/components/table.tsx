
import * as React from 'react';
import {
    Button,
    Container,
    Popup,
    Icon,
    Input, Table
} from 'semantic-ui-react'
import { EditDialog } from "./edit-dialog";
import {Attribute, StructType} from "../model/types";
import {ValueHandler } from "./type-handlers/editors";
import {Map, mapMap, sortBy} from "../utils";
import {_} from "../i18n/messages";
import {SafeClickWrapper, SafePopup} from "./utils/ssr-safe";
import {connect, Dispatch} from "react-redux";
import {createAddItemAction, IState, createDeleteAction, createUpdateItemAction, UpdateItemAction} from "../redux";
import * as QueryString from "querystring";
import {RouteComponentProps, withRouter} from "react-router"
import {Record} from "../model/instances";
import {deleteItem} from "../rest/client";
import {SchemaDialog} from "./schema-dialog";

/** Props injected by react-redux (the state) */
interface TableLayoutProps {
    schema : StructType;
    records: Record[]}

/** Event handler props injected by react redux */
interface TableDispatchProps {
    onUpdate: (newValue : Record) => void,
    onCreate: (newValue : Record) => void,
    onDelete: (id : string) => void}

type TableProps = TableLayoutProps & TableDispatchProps & RouteComponentProps<{}>;

interface ISort {
    key: string;
    asc:boolean;
}

function parseParams(queryString:string) {
    return QueryString.parse(queryString.replace(/^\?/, ''));
}

/** Extract sort directive from query params */
function extractSort(queryString: string) : ISort {
    let sort = parseParams(queryString).sort;
    console.log("query string: '%s', sort:'%s'", queryString, sort);
    if (sort) {
        let [sortKey, direction] = sort.split(".");
        return {
            key:sortKey,
            asc:direction == "asc"
        }
    } else {
        return null;
    }
}

/** Switch sort order upon click, do it via search parameters / location */
function onHeaderClick(props: RouteComponentProps<{}>, attr:string) {

    // Parse query string for current sort
    let sort = extractSort(props.location.search);

    console.log("current sort", sort);

    // Same key ? => toggle sort order
    let newAsc = (sort && sort.key == attr) ? ! sort.asc  : true;

    // Update current query with new sort
    let query = parseParams(props.location.search);
    query["sort"] = attr + "." + (newAsc ? "asc" : "desc")

    // Push it to history
    props.history.push("?" + QueryString.stringify(query));
}


const TableLayout: React.SFC<TableProps> = (props) => {

    let attrs = props.schema.attributes;

    // First header cell : the menu toolbox
    let columnsHeader = <Table.HeaderCell collapsing key="menu" >
        <SafeClickWrapper trigger={<Button icon="columns" size="mini" basic compact />} >
            <SchemaDialog
                onUpdate={() => {}}
                schema={props.schema}
            />
        </SafeClickWrapper>
    </Table.HeaderCell>;

    let sort = extractSort(props.location.search);

    // List of fields as table header
    let headers = attrs.map(attr =>
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
                            deleteItem(record._id).then(() => props.onDelete(record._id));
                        }

                    }} />
                </Button.Group>
            </Table.Cell>
            {attrs.map(attr =>
                <Table.Cell key={attr.name} >
                    <ValueHandler
                        editMode={false}
                        type={attr.type}
                        value={ record[attr.name] }
                        onValueChange={null}/>
                </Table.Cell>)}
        </Table.Row>
    );

    // Add item dilaog and button
    let AddItemButton =
        <SafeClickWrapper  trigger={
            <Button primary style={{float:"left"}} >
                <Icon name="plus" /> {_.add_item}
            </Button>
        }>
            <EditDialog
                value={{}}
                schema={props.schema}
                create={true}
                onUpdate={props.onCreate}  />
        </SafeClickWrapper>;


    return <Container>

        <div>
        { AddItemButton }
            <Input icon="search" style={{float:"right"}}/>
        </div>
        <Table celled>
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
    </Container>
};


// Map state to props, sort items
const mapStateToProps =(state : IState, routerProps: RouteComponentProps<{}>) : TableLayoutProps => {

    // Flatten map of records
    let records = mapMap(state.items,(key, item) => item) as Map[];

    // Apply sort directive
    let sort = extractSort(routerProps.location.search);
    if (sort) {
        sortBy(records,sort.key, !sort.asc);
    } else {
        // Default sort : creation time
        sortBy(records,"_creationTime", true);
    }

    return {
        schema: state.schema,
        records: records}
};

// Send actions to redux store upon events
const matchDispatchToProps = (dispatch: Dispatch<{}> ) => ({
    onUpdate : (newValue: Record) => dispatch(createUpdateItemAction(newValue)),
    onCreate : (newValue: Record) => dispatch(createAddItemAction(newValue)),
    onDelete : (id:string) => dispatch(createDeleteAction(id))});

// connect to redux
let reduxTable = connect<TableLayoutProps, TableDispatchProps, RouteComponentProps<{}>>(
    mapStateToProps,
    matchDispatchToProps
)(TableLayout);

// Inject route props
export let TableComponent = withRouter<{}>(reduxTable);

