/* Display type : table */
import {RouteComponentProps, withRouter} from "react-router"
import {Card} from "semantic-ui-react";
import {CollectionEventProps, RecordsRouteProps, RecordsProps} from "./props";
import * as React from "react";
import {editButtons} from "./edit-button";
import {SingleRecordComponent} from "./single-record-component";
import {getDbName, goToUrl} from "../../utils";
import {singleRecordLink} from "../../rest/api";
import {GlobalContextProps} from "../context/context";

type CardsProps = RecordsProps & CollectionEventProps & RouteComponentProps<RecordsRouteProps> & GlobalContextProps;

export const CardsComponent : React.SFC<CardsProps> = (props) => {

    let goToRecord = (id:string) => {
        goToUrl(props, singleRecordLink(getDbName(props), id));
    };

    let auth = props.global.auth;

    return <Card.Group >
        {props.records.map(record =>
            <Card>
                <Card.Content>
                <div style={{float:"right"}} className="super-shy" >
                    {editButtons(record, props, props.schema, auth)}
                </div>

                <div onClick={() => goToRecord(record._id)} style={{cursor:"pointer"}} >
                    <SingleRecordComponent
                    {...props}
                    record={record} />
                </div>

                </Card.Content>

            </Card>)}
    </Card.Group>

};

export const ConnectedCardsComponent = withRouter<RecordsProps & CollectionEventProps>(CardsComponent);

