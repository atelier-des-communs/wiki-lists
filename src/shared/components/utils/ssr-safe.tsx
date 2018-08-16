import {PopupProps, Popup} from "semantic-ui-react";
import * as react from "react";

import * as React from 'react';

type NoSSRProps = {
    onSSR: React.ReactNode,
    children: React.ReactNode
}

/** Safe wrapper in order not to render some components on server side,
 * Like popups and modals which require portals (not available here) */
export class SsrSafe extends React.Component<NoSSRProps> {
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

export interface SafeWrapperProps {
    trigger: JSX.Element;
}

/** A Dialog, safe to render on server side, without Portals, since it only render the "dialog" part when clicked */
export class SafeClickWrapper extends React.Component<SafeWrapperProps> {
    state : {open: boolean};
    constructor(props: SafeWrapperProps) {
        super(props);
        this.state = {open: false};
    }

    open = () => {
        this.setState({open:true});
    }

    close = () => {
        this.setState({open:false});
    }

    render() {
        let trigger = React.cloneElement(
            this.props.trigger,
            {onClick: () => {this.open()}});

        let children = this.state.open ?
            React.Children.map(this.props.children,
                child => React.cloneElement(
                    child as React.ReactElement<any>,
                    {close: () => this.close()})) : null;


        // Placeholder, shown anyway
        return <div>
            {trigger}
            {children}
        </div>;
    }
}


export const SafePopup : React.SFC<PopupProps> = (props) =>
    <SsrSafe onSSR={props.trigger}  >
        <Popup trigger={props.trigger} on="click">
            {props.children}
        </Popup>
    </SsrSafe>


