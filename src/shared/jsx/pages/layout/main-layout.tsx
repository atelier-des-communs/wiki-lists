import * as React from "react";
import "../../../img/logo.png";
import {Header} from "./header";
import {GlobalContextProps} from "../../context/global-context";

export const MainLayout : React.SFC<GlobalContextProps> = (props) => {

    let _ = props.messages;

    function goToHome() {
        window.location.href = "/";
    }

    let pointerCursor = {cursor:'pointer'};

    return <>
    <Header {...props}>

            <div style={{textAlign:"center"}}>
                <img
                    src="/static/img/logo.png"
                    width="300"
                    style={pointerCursor}
                    onClick={() => goToHome()} />
                <br/>
                <span
                    onClick={() => goToHome()}
                    style={{...pointerCursor, fontSize:"large"}}>
                    {_.site_title}</span>
            </div>

    </Header>

    {props.children}

    </>
};