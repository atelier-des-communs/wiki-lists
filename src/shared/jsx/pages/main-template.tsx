import * as React from "react";
import  "../../img/daadle.png";
import {MessagesProps, supportedLanguages} from "../../i18n/messages";
import {Button, Flag} from "semantic-ui-react";
import {SafePopup} from "../utils/ssr-safe";
import * as cookies from "browser-cookies";
import {LANG_COOKIE_NAME} from "../../api";
import {GlobalContextProps} from "../context/global-context";

export const MainTemplate : React.SFC<MessagesProps> = (props) => {

    let _ = props.messages;

    function goToHome() {
        window.location.href = "/";
    }

    function changeLang(langKey: string) {
        cookies.set(LANG_COOKIE_NAME, langKey);
        window.location.reload();
    }

    let pointerCursor = {cursor:'pointer'};

    let langSelector = <Button.Group compact size="small" floated="right">
        {supportedLanguages.map(lang =>
            <Button
                compact
                size="small"
                active={props.lang == lang.key}
                onClick={() => changeLang(lang.key)}>

                <Flag name={lang.flag} />

            </Button>
        )}
    </Button.Group >;

    return <>
        <div style={{
                padding:"3em",
                textAlign:"center",
                backgroundColor:"#f8f0df"
        }}>

            {langSelector}

            <img
                src="/img/daadle.png"
                width="300"
                style={pointerCursor}
                onClick={() => goToHome()} />

            <h3
                onClick={() => goToHome()}
                style={pointerCursor}>
                {_.daadle_title}</h3>
        </div>

    {props.children}

    </>
};