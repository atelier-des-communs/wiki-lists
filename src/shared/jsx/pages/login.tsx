import * as React from "react";
import {withGlobalContext} from "../context/global-context";
import {Button, Container, Form, Input} from "semantic-ui-react";
import {MainLayout} from "./layout/main-layout";
import {Map} from "../../utils";
import {PageProps} from "../common-props";
import {ErrorLabel} from "../utils/validation-errors";
import {ValidationErrors} from "../../validators/validators";

class _LoginPage extends React.Component<PageProps<{}>> {

    state: {
        email: string,
        password: string
        errors: ValidationErrors
    };

    constructor(props: PageProps<{}>) {
        super(props);
        this.state = {
            email: null,
            password: null,
            errors: {}
        };
    }


    submitForm() {
        let errors: Map<string> = {};
        if (!this.state.email) {
            errors.email = this.props.messages.should_not_be_empty;
        }
        if (!this.state.password) {
            errors.password = this.props.messages.should_not_be_empty;
        }
        this.setState({errors});
    }

    render() {

        let _ = this.props.messages;

        return <MainLayout {...this.props} >
            <Container>
                <Form>
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
                    <Form.Field width={6}>
                        <label>{_.auth.password}</label>
                        <Input
                            name="password"
                            type="password"
                            value={this.state.password}
                            onChange={(e, data) => this.setState({password: data.value})}
                        />

                        <ErrorLabel errors={this.state.errors.password}/>

                    </Form.Field>
                    <Button type='submit' onClick={() => this.submitForm()}>{_.auth.login}</Button>
                </Form>
            </Container>
        </MainLayout>
    }


}

// Inject global context
export const LoginPage = withGlobalContext(_LoginPage);