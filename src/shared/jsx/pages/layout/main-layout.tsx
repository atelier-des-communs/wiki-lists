import * as React from "react";
import "../../../img/logo.png";
import {Header} from "./header";
import {GlobalContextProps} from "../../context/global-context";

export class MainLayout extends React.Component<GlobalContextProps> {

    constructor(props: GlobalContextProps) {
        super(props);
    }

    goToHome() {
        window.location.href = "/";
    }

    render() {

        let props = this.props;
        let _ = props.messages;

        let pointerCursor = {cursor: 'pointer'};

        return <>
            <Header {...props}>

                <div style={{textAlign: "center"}}>
                    <img
                        src="/static/img/logo.png"
                        width="300"
                        style={pointerCursor}
                        onClick={() => this.goToHome()}/>
                    <br/>
                    <span
                        onClick={() => this.goToHome()}
                        style={{...pointerCursor, fontSize: "large"}}>
                    {_.site_title}</span>
                </div>

            </Header>

            {props.children}

        </>
    }
}