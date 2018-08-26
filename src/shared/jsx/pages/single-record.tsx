import * as React from "react";
import {RouteComponentProps} from "react-router";
import {SingleRecordRouteProps} from "../components/props";

export const SingleRecordPage : React.SFC<RouteComponentProps<SingleRecordRouteProps>> = (props) => {
    return <div>
        Hello : {props.match.params.db_name} / {props.match.params.id}
    </div>
}