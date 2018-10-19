import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Container} from "semantic-ui-react";
import {RouteComponentProps} from "react-router";
import {MainLayout} from "./layout/main-layout";

const NotFoundPageInternal : React.SFC<GlobalContextProps & RouteComponentProps<{}>> = (props: GlobalContextProps) => {
    let _ = props.messages;

    // Side effect : used on SSR for returning proper status code
    props.head.setStatusCode(404);

    return <MainLayout {...props} >
        <Container>
        <h1>404 - {_.not_found}</h1>
        </Container>
    </MainLayout>
};

export const NotFoundPage = withGlobalContext(NotFoundPageInternal);