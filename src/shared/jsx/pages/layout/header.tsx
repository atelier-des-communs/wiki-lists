import * as React from "react";
import "../../../img/logo.png";
import {MessagesProps, supportedLanguages} from "../../../i18n/messages";
import {Button, Flag} from "semantic-ui-react";
import {LANG_COOKIE} from "../../../api";
import {GlobalContextProps} from "../../context/global-context";

export const Header : React.SFC<GlobalContextProps> = (props) => {

    let _ = props.messages;

    function changeLang(langKey: string) {
        props.cookies.set(LANG_COOKIE, langKey);
        window.location.reload();
    }

    let langSelector = <Button.Group compact size="small" floated="right" style={{margin:"1em"}}>
        {supportedLanguages.map(lang =>
            <Button
                key={lang.key}
                compact
                size="small"
                active={props.lang == lang.key}
                onClick={() => changeLang(lang.key)}>

                <Flag name={lang.flag} />

            </Button>
        )}
    </Button.Group >;

    return <>

        {langSelector}

        <div style={{
            padding:"3em",
            marginBottom:"1em",
            backgroundColor:"white",
            borderBottom:"2px dashed #ddd"
        }}>
            {props.children}
        </div>


    </>
};