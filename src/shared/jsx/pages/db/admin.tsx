import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Link} from "react-router-dom";
import {
    DbPathParams,
    DbProps, PageProps,
    ReduxEventsProps,
    SingleRecordPathParams,
    SingleRecordProps,
    SingleRecordPropsOnly
} from "../../common-props";
import {SingleRecordComponent} from "../../components/single-record-component";
import {DispatchProp} from "react-redux";
import {createUpdateDbAction, IState} from "../../../redux/index";
import {Button, Container, Header, Segment, Modal, TextArea, Form} from "semantic-ui-react";
import {recordName, recordNameStr, restrictedMessage} from "../../utils/utils";
import {EditButtons} from "../../components/edit-button";
import {GlobalContextProps} from "../../context/global-context";
import {connectComponent} from "../../context/redux-helpers";
import {recordsLink} from "../../../api";
import {toAnnotatedJson} from "../../../serializer";
import {IMessages} from "../../../i18n/messages";
import {clone} from "lodash";
import {AccessRight, hasDbRight} from "../../../access";
import {updateEmails} from "../../../../client/rest/client-db";

type DbAdminProps =
    PageProps<DbPathParams> &
    DbProps & // mapped from redux react
    ReduxEventsProps &
    DispatchProp<any>

export class DbAdmin extends React.Component<DbAdminProps>  {

    state : {
        newEmails: string;
        emails : string[],
        showDialog: boolean
    }

    constructor(props : DbAdminProps     ) {
        super(props);
        this.state = {
            newEmails : "",
            emails : props.db.member_emails ? props.db.member_emails : [],
            showDialog:false};
    }
    setDialogStatus(visible:boolean) {
        this.setState({newEmails:"", showDialog:visible});
    }

    doUpdateEmails(emails:string[]) : Promise<void>{
        let newDb = clone(this.props.db);
        newDb.member_emails = emails;
        this.props.store.dispatch(createUpdateDbAction(newDb));
        return updateEmails(this.props.db.name, emails)
            .then(() => this.setState({emails}))
    }

    remove(email:string) {
        let emails = clone(this.state.emails);
        emails = emails.filter(e => e !== email);
        this.doUpdateEmails(emails);
    }

    private addEmails() {
        let newEmails=this.state.newEmails.split(/\r?\n/).map((val : string) => val.trim());
        this.doUpdateEmails(this.state.emails.concat(newEmails)).then(() => {
            this.setDialogStatus(false);
        })
    }

    render() {
        let {db, messages} = this.props;
        let _ = messages;

        return hasDbRight(db, this.props.user, AccessRight.ADMIN) ? <Container>
            <Header as={"h4"}>{_.member_list}</Header>
            <ul>
                {this.state.emails.map(email => {
                    return <Segment>
                        <Header>{email}</Header>
                        <Button negative content={_.delete_item} icon="trash" compact
                        onClick={() => this.remove(email)}/>
                    </Segment>
                })}
            </ul>
            <Button positive content={_.add_emails} onClick={()=> this.setDialogStatus(true) }/>
            <Modal
                open={this.state.showDialog}
                onClose={()=>this.setDialogStatus(false)}>
                <Modal.Header>{_.add_emails}</Modal.Header>
                <Modal.Content>
                    <Form>
                        <TextArea
                            value={this.state.newEmails}
                            onChange={(e, val) => this.setState({newEmails:val.value})} />
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button positive content={_.add_emails} icon="plus" onClick={()=>this.addEmails()} />
                </Modal.Actions>
            </Modal>
            </Container> : restrictedMessage(_);
    }


}



