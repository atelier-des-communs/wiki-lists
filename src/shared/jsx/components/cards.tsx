/* Display type : table */
import {RouteComponentProps} from "react-router"
import {Link} from 'react-router-dom'
import {Card, Grid} from "semantic-ui-react";
import {DbPathParams, DbProps, RecordsProps, UpdateActions} from "../common-props";
import * as React from "react";
import {EditButtons} from "./edit-button";
import {SingleRecordComponent} from "./single-record-component";
import {singleRecordLink} from "../../api";
import {GlobalContextProps} from "../context/global-context";
import {recordName} from "../utils/utils";
import {getDbName} from "../../utils";

type CardsProps = RecordsProps & DbProps & UpdateActions & RouteComponentProps<DbPathParams> & GlobalContextProps;

export class CardsComponent extends React.Component<CardsProps> {

    constructor(props: CardsProps) {
        super(props);
    }

    render() {
        let props = this.props;

        let recordURL = (id:string) => {
            return singleRecordLink(props.config, getDbName(props), id);
        };

        return <Grid stackable >
            {props.records.map(record =>
                <Grid.Column key={record._id} mobile={16} tablet={8} computer={4}>
                    <Card fluid className="hoverable">
                        <Card.Content  >
                            <Card.Header >
                                <div style={{position:"absolute", right:"0.5rem"}} className="super-shy" >
                                    <EditButtons {...props} record={record} />
                                </div>
                                <Link to={recordURL(record._id)}>
                                    {recordName(props.db.schema, record)}
                                </Link>
                            </Card.Header>
                        </Card.Content>
                        <Card.Content>
                            <SingleRecordComponent
                                {...props}
                                record={record}
                                large={false} />
                        </Card.Content>
                    </Card>
                </Grid.Column>)}
        </Grid>
    }
}
