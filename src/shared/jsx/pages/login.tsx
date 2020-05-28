import * as React from "react";
import {withGlobalContext} from "../context/global-context";
import {Button, Container, Form, Input, Message} from "semantic-ui-react";
import {MainLayout} from "./layout/main-layout";
import {Map} from "../../utils";
import {PageComponent, PageProps} from "../common-props";
import {ErrorLabel} from "../utils/validation-errors";
import {ValidationErrors} from "../../validators/validators";
import {sendConnectionLink} from "../../../client/rest/client-db";

class _LoginPage extends PageComponent<{}> {

    state: {
        email: string,
        password: string,
        errors: ValidationErrors,
        linkSent:boolean,
    };

    constructor(props: PageProps<{}>) {
        super(props);
        this.state = {
            email: null,
            password: null,
            errors: {},
            linkSent : false
        };
    }


    async submitForm() {
        let errors: Map<string> = {};
        if (!this.state.email) {
            errors.email = this.props.messages.should_not_be_empty;
            this.setState({errors});
        } else {
            await sendConnectionLink(this.state.email);
            this.setState({linkSent:true});
        }
    }

    render() {

        let _ = this.props.messages;

        return <MainLayout {...this.props} >
            <Container>
                <Form>


                    {this.state.linkSent ?
                        <Message info>
                            <p>{_.auth.connection_link_sent.replace("%EMAIL%", this.state.email)}</p>
                        </Message>

                        :

                        <>
                            <Form.Field width={6}>
                                <label>{_.email}</label>
                                <Input
                                    name="email"
                                    placeholder={_.email}
                                    value={this.state.email}
                                    onChange={(e, data) => this.setState({email: data.value})}
                                />

                                <ErrorLabel errors={this.state.errors.email}/>

                            </Form.Field>
                            <Button type='submit' positive onClick={() => this.submitForm()}>
                                {_.auth.send_connection_link}
                            </Button>
                        </>
                    }


                </Form>
            </Container>
        </MainLayout>;
    }


}

// Inject global context
export const LoginPage = withGlobalContext(_LoginPage);