import * as React from "react";
import {GlobalContextProps} from "../context/global-context";
import {Button, Segment, Step} from "semantic-ui-react";


export interface WizardStepProps {
    title: string;
    validator : () => Promise<boolean>;
}

export const WizardStep : React.SFC<WizardStepProps> = (props) => {
    return <>
        {props.children}
        </>;
}

export class Wizard extends React.Component<GlobalContextProps> {

    state : {step: number};
    wizardSteps : React.Component<WizardStepProps>[];

    constructor(props:GlobalContextProps) {
        super(props);
        this.state = {step: 0};
        this.wizardSteps = React.Children.toArray(this.props.children) as any;
    }

    previousStep() {
        this.setState({step:this.state.step-1});
    }

    nextStep() {
        let validator = this.wizardSteps[this.state.step].props.validator();
        validator.then((res:boolean) => {
            if (res && this.state.step < this.wizardSteps.length - 1) {
                this.setState({step:this.state.step+1});
            }
        });
    }

    render() {
        let _ = this.props.messages;

        // Shold be WizardStep
        let steps = React.Children.map(this.props.children, (child, index) =>
            <Step active={this.state.step == index} >
            <Step.Content >
                <Step.Title>{(child as any).props.title}</Step.Title>
            </Step.Content>
        </Step>);

        let content = React.Children.map(this.props.children, (child, index) => index== this.state.step ? child : null);


        let lastStep = this.state.step == this.wizardSteps.length  - 1;

        return <div>
            <Step.Group attached="top" ordered>
                {steps}
            </Step.Group>
            <Segment attached="bottom">
                {content}

                <div style={{textAlign:"right"}}>

                    {this.state.step > 0 &&
                    <Button content={_.previous} icon="angle left"
                            onClick={() => this.previousStep()}
                    />}

                    {this.state.step < this.wizardSteps.length &&
                    <Button
                        primary={!lastStep}
                        color={ lastStep ? "green" : null}
                        content={lastStep ? _.finish : _.next}
                        icon={lastStep ? "angle right" : null}
                        onClick={() => this.nextStep()}
                    />}

                </div>
            </Segment>

        </div>;
    }

}
