import * as React from "react";
import "../../../img/logo.png";
import {Button, Flag} from "semantic-ui-react";
import {LANG_COOKIE, LOGIN_PAGE_PATH, PROFILE_PAGE_PATH} from "../../../api";
import {GlobalContextProps} from "../../context/global-context";
import {Link} from "react-router-dom";

/** Common header : showing language switch and login */
export const Header : React.SFC<GlobalContextProps> = (props) => {

    let _ = props.messages;

    function changeLang(langKey: string) {
        props.cookies.set(LANG_COOKIE, langKey);
        window.location.reload();
    }

    let langSelector = <Button.Group compact size="mini" floated="right" style={{margin:"5px"}}>

        {props.supportedLanguages.map(lang =>
            <Button
                key={lang.key}
                compact size="small"
                active={props.lang == lang.key}
                onClick={() => changeLang(lang.key)}>

                <Flag name={lang.flag} />

            </Button>
        )}
    </Button.Group >;

    let ConnectOrPprfileButton = () => { return props.user ?
        <Button as={Link}
                to={PROFILE_PAGE_PATH}
                icon="user"
                floated="right" style={{margin:"5px"}}
                key="user"
                compact primary size="small"
                content={_.auth.profile} />

        : <Button as={Link}
                  to={LOGIN_PAGE_PATH}
                  floated="right" style={{margin:"5px"}}
                  key="user"
                  compact primary size="small"
                  content={_.auth.login} />
    }

    return <>

        <ConnectOrPprfileButton />

        {langSelector}

        <div style={{
            padding:"3em",
            marginBottom:"3em",
            backgroundColor:"white",
            boxShadow: "0px 0px 10px 2px rgba(0,0,0,0.58)"
        }}>
            {props.children}
        </div>


    </>
};