import * as React from "react";
import {withGlobalContext} from "../context/global-context";
import {Button, Container} from "semantic-ui-react";
import {Link} from "react-router-dom";
import {CREATE_DB_PATH} from "../../api";
import {MainLayout} from "./layout/main-layout";
import {PageSFC} from "../common-props";


const HomePageInternal : PageSFC<{}> = (props) => {

    let _ = props.messages;

    props.head.setTitle(`${props.config.site_name} | ${_.site_title}`);

    return <MainLayout {...props} >
        <Container>
            <Button
                positive
                as={Link}
                to={CREATE_DB_PATH}
                content={_.create_db}
                icon="add" />
        </Container>
    </MainLayout>
}

// Inject global context
export const HomePage = withGlobalContext(HomePageInternal);