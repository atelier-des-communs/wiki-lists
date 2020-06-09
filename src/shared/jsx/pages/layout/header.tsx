import * as React from "react";
import "../../../img/logo.png";
import {Button, Flag} from "semantic-ui-react";
import {LANG_COOKIE, LOGIN_PAGE_PATH, PROFILE_PAGE_PATH} from "../../../api";
import {GlobalContextProps} from "../../context/global-context";
import {Link} from "react-router-dom";
import {hasDbRight} from "../../../access";

type ExtraButtonsType = {
    extraButtons ?: React.ReactNode
}

/** Common header : showing language switch and login */
export const Header : React.SFC<GlobalContextProps & ExtraButtonsType> = (props) => {

    let _ = props.messages;

    function changeLang(langKey: string) {
        props.cookies.set(LANG_COOKIE, langKey);
        window.location.reload();
    }

    let langSelector = <Button.Group compact size="mini" floated="right" className="wl-margin">

        {props.supportedLanguages.map(lang =>
            <Button
                key={lang.key}
                active={props.lang == lang.key}
                onClick={() => changeLang(lang.key)}>

                <Flag name={lang.flag} />

            </Button>
        )}
    </Button.Group >;

    let ConnectOrPprfileButton = () => { return props.user ?
        <Button as={Link} to={PROFILE_PAGE_PATH}
                icon="user" key="user" primary content={_.auth.profile} />

        : <Button as={Link} to={LOGIN_PAGE_PATH}
                  key="user" primary content={_.auth.login} />
    }

    return <>

        <Button.Group size="mini" compact floated="right" className="wl-margin" >
            <ConnectOrPprfileButton />
            {props.extraButtons}
        </Button.Group>

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