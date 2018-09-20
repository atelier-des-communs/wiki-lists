import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Container} from "semantic-ui-react";
import {RouteComponentProps} from "react-router";

const NotFoundPageInternal : React.SFC<GlobalContextProps & RouteComponentProps<{}>> = (props: GlobalContextProps) => {
    let _ = props.messages;
    return <Container>
        <h1>404 - {_.not_found}</h1>
    </Container>
};

export const NotFoundPage = withGlobalContext(NotFoundPageInternal);