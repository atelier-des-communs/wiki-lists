import * as React from "react";
import {withGlobalContext} from "../context/global-context";
import {Button, Container} from "semantic-ui-react";
import {Link} from "react-router-dom";
import {CREATE_DB_PATH} from "../../api";
import {MainLayout} from "./layout/main-layout";
import {PageProps} from "../common-props";

class HomePageInternal extends React.Component<PageProps<{}>> {

    constructor(props: PageProps<{}>) {
        super(props);
    }

    render(){
        let props = this.props;
        let _ = props.messages;

        props.head.setTitle(`${_.site_name} | ${_.site_title}`);

        return <MainLayout {...props} >
            <Container>
                <Button
                    as={Link}
                    to={CREATE_DB_PATH}
                    content={_.create_db}
                    icon="add" />
            </Container>
        </MainLayout>
    }
}

// Inject global context
export const HomePage = withGlobalContext(HomePageInternal);