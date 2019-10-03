import * as React from "react";

interface CollapsibleProps {
    trigger: (open:boolean) => JSX.Element;
    open?:boolean
}

export class Collapsible extends React.Component<CollapsibleProps> {
    state:{
        open:boolean;
    };
    constructor(props:CollapsibleProps) {
        super(props);
        let open = (typeof(this.props.open) == "undefined") ? true : this.props.open;
        this.state = {open};
    }

    toggle() {
        this.setState({open: ! this.state.open});
    }

    render() {

        let trigger= React.cloneElement(
            this.props.trigger(this.state.open),
            {onClick: () => {this.toggle()}});

        return <>
                { trigger }
                {this.state.open ? this.props.children : null}
            </>
    }
}