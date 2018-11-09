import {Responsive, Button, ButtonProps} from "semantic-ui-react";

import * as React from "react";

/** A button only showing icon for mobiles */
export class ResponsiveButton extends React.Component<ButtonProps, {}> {
    render() {
        return <>

        <Responsive minWidth={768} as={Button}
                    {...this.props} />
        <Responsive maxWidth={767}
                    as={Button}
                    {...this.props}
                    content={null} />
        </>
    }
}