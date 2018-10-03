/* Display type : table */
import {RouteComponentProps} from "react-router"
import {Link} from 'react-router-dom'
import {Card, Grid} from "semantic-ui-react";
import {DbPathParams, RecordsProps, ReduxEventsProps} from "../common-props";
import * as React from "react";
import {EditButtons} from "./edit-button";
import {SingleRecordComponent} from "./single-record-component";
import {singleRecordLink} from "../../api";
import {GlobalContextProps} from "../context/global-context";
import {recordName} from "../utils/utils";
import {goToUrl} from "../../utils";
import {FilterSidebar, FiltersPopup} from "../type-handlers/filters";

type CardsProps = RecordsProps & ReduxEventsProps & RouteComponentProps<DbPathParams> & GlobalContextProps;

export const CardsComponent : React.SFC<CardsProps> = (props) => {

    let recordURL = (id:string) => {
        return singleRecordLink(props.match.params.db_name, id);
    };

    return <Card.Group >

        {props.records.map(record =>
            <Card className="hoverable">

                    <Card.Content  >
                        <Card.Header >

                            <Link to={recordURL(record._id)}>
                            {recordName(props.schema, record)}
                            </Link>
                            <div style={{float:"right"}} className="super-shy" >
                                <EditButtons {...props} record={record} />
                            </div>
                        </Card.Header>
                    </Card.Content>
                    <Card.Content>
                        <SingleRecordComponent
                            {...props}
                            record={record} />
                    </Card.Content>

            </Card>)}
    </Card.Group>
};
