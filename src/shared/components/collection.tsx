
import * as React from 'react';
import {
    Button,
    Container,
    Popup,
    Icon,
    Input, Table, Header, Dropdown
} from 'semantic-ui-react'
import { EditDialog } from "./edit-dialog";
import {StructType, Types} from "../model/types";
import {goTo, Map, mapMap, parseParams} from "../utils";
import {_} from "../i18n/messages";
import {SafeClickWrapper, SafePopup} from "./utils/ssr-safe";
import {connect, Dispatch} from "react-redux";
import {
    createAddItemAction,
    IState,
    createDeleteAction,
    createUpdateItemAction,
    createUpdateSchema
} from "../redux";

import {RouteComponentProps, withRouter} from "react-router"
import {Record} from "../model/instances";
import {ConnectedFilters, ConnectedSearchComponent} from "./type-handlers/filters";
import {searchAndFilter} from "../views/filters";
import {CollectionEventProps, ReduxProps} from "./common";
import {ConnectedTableComponent} from "./table";
import {extractGroupBy, groupBy, updatedGroupBy} from "../views/group";
import {Collapsible} from "./utils/collapsible";
import {SchemaDialog} from "./schema-dialog";

type CollectionProps = ReduxProps & CollectionEventProps & RouteComponentProps<{}>;

function sectionHeader(groupKey:string, groupVal:string, open : boolean) {
    return <Header size={"large"} style={{marginTop:"10px"}}>
        <Button
            circular
            icon={open ? "chevron down" : "chevron right"} />
        {groupKey} : {groupVal}
    </Header>
}

function content(groupAttr: string, props:CollectionProps) {

    if (groupAttr) {
        let groups = groupBy(props.records, groupAttr);
        let sections = groups.map(group =>
            <div>
                <Collapsible trigger={open =>
                    <Header
                        size="medium"
                        style={{marginTop:"1em", cursor:"pointer"}}>
                        <Icon size="small" name={open ? "chevron down" : "chevron right"} />
                        {groupAttr} : {group.key}
                    </Header>} >

                    <ConnectedTableComponent
                        onUpdate={props.onUpdate}
                        onCreate={props.onCreate}
                        onDelete={props.onDelete}
                        onUpdateSchema={props.onUpdateSchema}
                        schema={props.schema}
                        records={group.records}
                    />
                </Collapsible>
            </div>);
        return <div>
            {sections}
        </div>
    } else {
        return <ConnectedTableComponent
            onUpdate={props.onUpdate}
            onCreate={props.onCreate}
            onDelete={props.onDelete}
            onUpdateSchema={props.onUpdateSchema}
            schema={props.schema}
            records={props.records}
        />
    }
}

const CollectionComponent: React.SFC<CollectionProps> = (props) => {

    let DownloadButton= <SafePopup trigger={<Button icon="download" basic />} >
        <div>
            <a href={"/xls" + props.location.search}><b>Excel</b></a>
            <br/>
            <a href={"/json" + props.location.search}><b>JSON</b></a>
        </div>
        </SafePopup>;

    // Add item dilaog and button
    let AddItemButton = <SafeClickWrapper  trigger={
            <Button primary style={{marginBottom:"1em"}} icon="plus" content={_.add_item} />
        }>
            <EditDialog
                value={{}}
                schema={props.schema}
                create={true}
                onUpdate={props.onCreate}  />
        </SafeClickWrapper>;


    let groupAttr = extractGroupBy(parseParams(props.location.search));
    let groupOptions = props.schema.attributes
        .filter(attr => attr.type.tag == Types.ENUM)
        .map(attr => ({text:attr.name, value:attr.name}));

    groupOptions = [{value:null, text:_.empty_group_by}].concat(groupOptions);

    let groupBySelect = <Dropdown selection inline
                                  placeholder={_.group_by}
                            options={groupOptions}
                            value={groupAttr}
                                  label={_.group_by}
                            onChange={(e, update) =>  goTo(props, updatedGroupBy(update.value as string))} />


    let UpdateSchemaButton = <SafeClickWrapper trigger={
        <Button icon="configure" content={_.edit_attributes} />} >
            <SchemaDialog
                onUpdate={(newSchema) => {props.onUpdateSchema(newSchema)}}
                schema={props.schema}
        />
    </SafeClickWrapper>;

    return <div>

        <div style={{padding:'20px'}}>
            <div style={{float:"right"}} >
                <ConnectedSearchComponent schema={props.schema} />
                { DownloadButton }
            </div>

        </div>

        <div style={{display:"table", width:"100%", padding:"1em"}}>
            <div style={{display: "table-cell"}}>
                <ConnectedFilters schema={props.schema} />
            </div>
            <div style={{display:"table-cell", width:"100%"}}>
                { AddItemButton }
                { UpdateSchemaButton }
                {groupBySelect}
                { content(groupAttr, props) }
            </div>
        </div>
    </div>
}


// Fetch data from Redux store and map it to props
const mapStateToProps =(state : IState, routerProps: RouteComponentProps<{}>) : ReduxProps => {

    // Flatten map of records
    let records = mapMap(state.items,(key, item) => item) as Map[];

    // Apply search and sorting
    let params = parseParams(routerProps.location.search);
    records = searchAndFilter(records, params, state.schema);

    return {
        schema: state.schema,
        records: records}
};

// Send actions to redux store upon events
const matchDispatchToProps = (dispatch: Dispatch<{}> ) => ({
    onUpdate : (newValue: Record) => dispatch(createUpdateItemAction(newValue)),
    onUpdateSchema : (schema: StructType) => dispatch(createUpdateSchema(schema)),
    onCreate : (newValue: Record) => dispatch(createAddItemAction(newValue)),
    onDelete : (id:string) => dispatch(createDeleteAction(id))});

// connect to redux
let CollectionComponentWithRedux = connect<ReduxProps, CollectionEventProps, RouteComponentProps<{}>>(
    mapStateToProps,
    matchDispatchToProps
)(CollectionComponent);

// Inject route props
export const ConnectedCollectionComponent = withRouter<{}>(CollectionComponentWithRedux);

