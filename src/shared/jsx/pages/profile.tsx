import * as React from "react";
import {withGlobalContext} from "../context/global-context";
import {Button, Container, Form, Input, Message, Label} from "semantic-ui-react";
import {MainLayout} from "./layout/main-layout";
import {Map} from "../../utils";
import {PageComponent, PageProps} from "../common-props";
import {ErrorLabel} from "../utils/validation-errors";
import {ValidationErrors} from "../../validators/validators";
import {sendConnectionLink} from "../../../client/rest/client-db";
import {Link} from "react-router-dom";
import {LOGOUT_URL} from "../../api";

class _ProfilePage extends PageComponent<{}> {

    constructor(props: PageProps<{}>) {
        super(props);
    }

    render() {

        let _ = this.props.messages;

        return <MainLayout {...this.props} >
            <Container>
                <p>
                    <b>Email : </b>&nbsp;
                    <Label>{this.props.user.email}</Label>
                </p>
                <Button primary as="a" icon="sign-out" content={_.auth.logout} href={LOGOUT_URL}/>
            </Container>
        </MainLayout>;
    }


}

// Inject global context
export const ProfilePage = withGlobalContext(_ProfilePage);