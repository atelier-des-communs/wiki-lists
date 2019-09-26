import * as React from "react";
import "../../../img/logo.png";
import {Button, Flag} from "semantic-ui-react";
import {LANG_COOKIE, LOGIN_PAGE_PATH} from "../../../api";
import {GlobalContextProps} from "../../context/global-context";
import {Link} from "react-router-dom";

/** Common header : showing language switch and login */
export class Header extends  React.Component<GlobalContextProps>  {

    constructor(props : GlobalContextProps) {
        super(props);
    }

    changeLang(langKey: string) {
        this.props.cookies.set(LANG_COOKIE, langKey);
        window.location.reload();
    }

    render() {

        let props = this.props;
        let _ = props.messages;

        let LangSelector = () => {
            if (props.supportedLanguages.length == 1) {
                return null;
            }
            return <Button.Group compact size="mini" floated="right" style={{margin:"5px"}}>

                {props.supportedLanguages.map(lang =>
                    <Button
                        key={lang.key}
                        compact size="small"
                        active={props.lang == lang.key}
                        onClick={() => this.changeLang(lang.key)}>

                        <Flag name={lang.flag} />

                    </Button>
                )}
            </Button.Group >;
        }

        return <>

            <Button as={Link}
                    to={LOGIN_PAGE_PATH}
                    floated="right" style={{margin:"5px"}}
                    key="user"
                    compact primary size="small"
                    content={_.auth.login} />

            <LangSelector />

            <div style={{
                padding:"3em",
                marginBottom:"3em",
                backgroundColor:"white",
                boxShadow: "0px 0px 10px 2px rgba(0,0,0,0.58)"
            }}>
                {props.children}
            </div>


        </>;
    }

}