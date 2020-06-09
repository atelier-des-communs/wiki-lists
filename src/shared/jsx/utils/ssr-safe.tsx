import {Button, ButtonProps, Popup, PopupProps} from "semantic-ui-react";
import * as React from "react";

type NoSSRProps = {
    onSSR?: React.ReactNode,
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
        let { children, onSSR} = this.props;
        if (!onSSR) {
            onSSR = null;
        }
        return (this.state.canRender ? children : onSSR) as JSX.Element;
    }
}

export interface RenderProps {
    render : (onClose :() => void) => JSX.Element;
}

export interface SafeWrapperProps extends RenderProps {
    trigger: (onOpen : () => void) => JSX.Element;
}

/** A Dialog, safe to render on server side, without Portals, since it only render the "dialog" part when clicked */
export class SafeClickWrapper extends React.Component<SafeWrapperProps> {
    state : {open: boolean};
    constructor(props: SafeWrapperProps) {
        super(props);
        this.state = {open: false};
    }

    open() {
        this.setState({open:true});
    }

    close() {
        this.setState({open:false});
    }

    render() {

        let open = this.open.bind(this);
        let close = this.close.bind(this);

        // Placeholder, shown anyway
        return  <>
            {this.props.trigger(open)}
            {this.state.open ? this.props.render(close): null}
        </>;

    }
}

export const ButtonWrapper = (props:RenderProps & ButtonProps) => {
    let {render, ...others} = props;
    return <SafeClickWrapper
        trigger={(onOpen) =>
            <Button
                {...others}
                onClick={onOpen}>
            </Button>}
        render={render} >
    </SafeClickWrapper>
}

export const SafePopup : React.SFC<PopupProps> = (props) => {
    return <SsrSafe onSSR={props.trigger}>
        <Popup position="bottom right" {...props}  trigger={props.trigger} on="click" onClick={(e: any) => {
            e.stopPropagation()
        }}>
            {props.children}
        </Popup>
    </SsrSafe>
};

