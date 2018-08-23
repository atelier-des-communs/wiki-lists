/* Display type : table */
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {goTo, parseParams, updatedQuery} from "../../utils";
import {RouteComponentProps, withRouter} from "react-router"
import {_} from "../../i18n/messages";
import {deleteItem} from "../../rest/client";
import {Grid, Header, Card} from "semantic-ui-react";
import {CollectionEventProps, RecordProps} from "./props";
import * as React from "react";
import {ellipsis, filterAttribute, typeIsWide} from "../utils/utils";
import {Record} from "../../model/instances";
import {ValueHandler} from "../type-handlers/editors";
import {editButtons} from "./edit-button";

type CardsProps = RecordProps & CollectionEventProps & RouteComponentProps<{}>;

export const CardsComponent : React.SFC<CardsProps> = (props) => {

    let filterAttributeFunc = filterAttribute(props, props.schema);


    let singleCard = (record : Record) => <>
        {props.schema.attributes
            .filter(filterAttributeFunc).map(attr =>
                <div style={{marginBottom: "0.5em"}}>
                    <b>{ellipsis(attr.name, 10)} : </b>
                    <ValueHandler
                        editMode={false}
                        value={record[attr.name]}
                        type={attr.type} />
                </div>)}
    </>


    return <Card.Group >
        {props.records.map(record =>
            <Card>
                <Card.Content>
                <div style={{float:"right"}} className="super-shy" >
                    {editButtons(record, props, props.schema)}
                </div>
                { singleCard(record) }
                </Card.Content>
            </Card>)}
    </Card.Group>

};

export const ConnectedCardsComponent = withRouter<RecordProps & CollectionEventProps>(CardsComponent);

