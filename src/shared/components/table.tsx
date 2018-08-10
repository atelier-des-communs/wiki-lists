
import * as React from 'react';


import {
    Button,
    Container,
    Divider,
    Grid,
    Header,
    Image,
    List,
    Menu,
    Segment,
    Sidebar,
    Visibility,
    Responsive,
    Popup,
    Icon,
    Table
} from 'semantic-ui-react'
import { EditDialog } from "./dialog";
import {Attribute, StructType} from "../model/types";
import {ValueHandler } from "./handlers";
import {Map} from "rxjs/util/Map";
import {mapMap} from "../utils";
import {_} from "../i18n/messages";
import {renderToString} from "react-dom/server";
import {SafePopup} from "./utils/no-ssr";
import {connect, Dispatch} from "react-redux";
import {ADD_ITEM, AddItemAction, createAction, IState, UPDATE_ITEM, UpdateItemAction} from "../redux";


interface TableLayoutProps {
    schema : StructType;
    items: {[key: string]: any};
}

interface TableDispatchProps {
    onUpdate: (newValue : {}) => void;
    onCreate: (newValue : {}) => void;
}

const TableLayout: React.SFC<TableLayoutProps & TableDispatchProps> = (props) => {

    let attrs = props.schema.attributes;

    let headers = attrs.map(attr =>
        <Table.HeaderCell  key={attr.name} >
            {attr.name}
            </Table.HeaderCell>);

    // Add the menu selector
    let columnsHeader = <Table.HeaderCell collapsing key="menu" >
        <SafePopup trigger={<Button icon="columns" size="mini" basic compact />} >
                <Popup.Header>Columns</Popup.Header>
                <Popup.Content>Foobar</Popup.Content>
            </SafePopup>
    </Table.HeaderCell>;

    const rows  = mapMap(props.items, (key, item) =>
        <Table.Row key={key}>
            <Table.Cell collapsing key="actions" >
                <EditDialog
                    value={item}
                    schema={props.schema}
                    editMode={true}
                    onUpdate={props.onUpdate}  />
            </Table.Cell>
            {attrs.map(attr =>
                <Table.Cell key={attr.name} >
                    <ValueHandler
                        editMode={false}
                        type={attr.type}
                        value={ item[attr.name] }
                        onValueChange={null}/>
                </Table.Cell>)}
        </Table.Row>
    );

    return <Container>

        <Button primary >
            <Icon name="plus" />
            {_.add_item}
        </Button>

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

// Connect table to redux store
const matchDispatchToProps = (dispatch: Dispatch<{}> ) => ({
    onUpdate : (newValue: {}) => dispatch(createAction(UPDATE_ITEM, newValue)),
    onCreate : (newValue: {}) => dispatch(createAction(ADD_ITEM, newValue))
});

/** Connect table to redux store */
export let ConnectedTableLayout = connect<TableLayoutProps, TableDispatchProps, {}>(
    (state : IState) => ({
        schema : state.schema,
        items: state.items}),
    matchDispatchToProps
)(TableLayout);

