import {extractSort} from "../views/sort";
import {parseParams, updatedQuery} from "../utils";
import {RouteComponentProps, withRouter} from "react-router"
import {_} from "../i18n/messages";
import {deleteItem} from "../rest/client";
import {CollectionEventProps, ReduxProps} from "./common";
import * as React from "react";
import {Button, Icon, Table} from 'semantic-ui-react'
import {SafeClickWrapper, SafePopup} from "./utils/ssr-safe";
import {SchemaDialog} from "./schema-dialog";
import {EditDialog} from "./edit-dialog";
import {ValueHandler} from "./type-handlers/editors";
import {extractGroupBy} from "../views/group";
import {Attribute} from "../model/types";
import {extractFilters} from "../views/filters";
import {singleFilter} from "./type-handlers/filters";

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

interface EditableCellProps {
    attr : Attribute;
    value : any;
}

/*
class EditableCell extends React.Component<EditableCellProps> {

    state: {edit:boolean};

    constructor(props:EditableCellProps) {
        super(props);
        this.state = {edit:false};
    }

    editMode = () => {
        this.setState({edit:true});
    }

    viewMode = () => {
        this.setState({edit:false});
    }

    render() {
        return <Table.Cell
            onClick = {() => this.editMode()}
        onBlur = {() => alert("I am blured")} >
            <ValueHandler
                editMode={this.state.edit}
                type={this.props.attr.type}
                value={this.props.value} />
        </Table.Cell>
    }

}
*/

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

    let queryParams = parseParams(props.location.search);
    let sort = extractSort(queryParams);
    let filters = extractFilters(props.schema, queryParams);

    /* Column headers, for each attribute */
    let headers = attrs.filter(filterColumns).map(attr => {

        let sorted = sort && sort.key == attr.name;
        let filter = filters[attr.name];

        // May be null if filter not supported for this type
        let filterComp = singleFilter(props, attr, filter);

        return <Table.HeaderCell
            key={attr.name}
            style={{cursor:"pointer"}}
            onClick={() => onHeaderClick(props, attr.name)} >


            <div style={{display:"table-row", width:"100%"}}>
                <div style={{display: "table-cell", width:"100%" }}>
                    { attr.name }
                </div>


                    { filterComp &&
                    <div style={{display: "table-cell"}}>
                        <SafePopup position="bottom right" trigger={
                           <Button
                               size="mini"  className="shy" compact
                               icon="filter"
                               color={filter ? "blue" : null}
                               onClick={(e:any) => e.stopPropagation()}/> }>
                            {filterComp}
                        </SafePopup>
                    </div>}

                    <div style={{display: "table-cell"}}>
                    <Icon
                        name={(sorted) ? (sort.asc ? "sort up" : "sort down") : "sort" }
                        className={sorted ? null: "shy"} />
                    </div>

            </div>
        </Table.HeaderCell>
    });

    /* Table rows */
    const rows  = props.records.map(record =>

        <Table.Row key={record["_id"] as string}>

            <Table.Cell collapsing key="actions" >
                <Button.Group basic>

                    <SafeClickWrapper trigger={
                        <Button
                            className="shy"
                            icon="edit"
                            size="mini" basic compact /> }>

                        <EditDialog
                            value={record}
                            schema={props.schema}
                            create={false}
                            onUpdate={props.onUpdate}  />

                    </SafeClickWrapper>
                    <Button icon="delete" className="shy" size="mini" basic compact onClick={() => {
                        if (confirm(_.confirm_delete)) {
                            props.onDelete(record._id);
                        }
                    }} />
                </Button.Group>
            </Table.Cell>

            {attrs.filter(filterColumns).map(attr =>
                <Table.Cell key={attr.name}>
                    <ValueHandler
                        editMode={false}
                        type={attr.type}
                        value={record[attr.name]} />
                </Table.Cell>
            )}

        </Table.Row>);

    /** Whole table */
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

