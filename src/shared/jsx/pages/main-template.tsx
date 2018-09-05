import * as React from "react";
import  "../../img/daadle.png";
import {MessagesProps} from "../../i18n/messages";

export const MainTemplate : React.SFC<MessagesProps> = (props) => {

    function goToHome() {
        window.location.href = "/";
    }

    let pointerCursor = {cursor:'pointer'};
    let _ = props.messages;

    return <>
        <div style={{
                padding:"3em",
                textAlign:"center",
                backgroundColor:"#f8f0df"
        }}>
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