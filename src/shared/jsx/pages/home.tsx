import * as React from "react";
import {GlobalContextProps, withGlobalContext} from "../context/global-context";
import {Container, Button} from "semantic-ui-react";
import {RouteComponentProps} from "react-router";
import {Link} from "react-router-dom";
import {CREATE_DB_PATH} from "../../api";
import {MainLayout} from "./layout/main-layout";

export const HomePageInternal : React.SFC<GlobalContextProps & RouteComponentProps<{}>> = (props) => {
    let _ = props.messages;


    return <MainLayout messages={props.messages} lang={props.lang} >
        <Container>
            <Button
                as={Link}
                to={CREATE_DB_PATH}
                content={_.create_db}
                icon="add" />
        </Container>
    </MainLayout>
}

// Inject global context
export const HomePage = withGlobalContext(HomePageInternal);