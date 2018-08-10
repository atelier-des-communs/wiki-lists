import {PopupProps, Popup} from "semantic-ui-react";


import * as React from 'react';



type NoSSRProps = {
    onSSR: React.ReactNode,
    children: React.ReactNode
}

/** Safe wrapper in order not to render some components on server side,
 * Like popups and modals which require portals (not available here) */
export class NoSSR extends React.Component<NoSSRProps> {
    state : {
        canRender:boolean;
    };

    constructor(props: NoSSRProps) {
        super(props);
        this.state = {
            canRender: false
        };
    }

    componentDidMount() {
        this.setState({canRender: true});
    }

    public render() {
        const { children, onSSR } = this.props;
        return (this.state.canRender ? children : onSSR) as JSX.Element;
    }
}

export const SafePopup : React.SFC<PopupProps> = (props) =>
    <NoSSR onSSR={props.trigger}  >
        <Popup trigger={props.trigger} on="click">
            {props.children}
        </Popup>
    </NoSSR>
