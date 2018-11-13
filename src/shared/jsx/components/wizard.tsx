/** Generic Wizard component */
import * as React from "react";
import {GlobalContextProps} from "../context/global-context";
import {Button, Segment, Step} from "semantic-ui-react";
import {fireValidators, RemainingErrorsPO, ErrorsContext} from "../utils/validation-errors";
import {ValidationError, ValidationException} from "../../validators/validators";
import {Map} from "../../utils";

export interface WizardStepProps {
    title: string;
    validator? : () => Promise<ValidationError[] | null>;
}

export interface WizardProps {
    onValidate : () => void; // Called upon sucessfull validation of last step
}

export const WizardStep : React.SFC<WizardStepProps> = (props) => {
    return <>
        {props.children}
        </>;
}

export class Wizard extends React.Component<GlobalContextProps & WizardProps> {

    state : {
        step: number,
        errors:  Map<ValidationError[]> // We separate validation errors per step
    };
    wizardSteps : React.Component<WizardStepProps>[];

    constructor(props:GlobalContextProps & WizardProps) {
        super(props);
        this.state = {step: 0, errors:{}};
        this.wizardSteps = React.Children.toArray(this.props.children) as any;

        // Init map of errors
        for (var i=0; i < this.wizardSteps.length; i++) {
            this.state.errors[i] = [];
        }
    }

    previousStep() {
        this.setState({step:this.state.step-1});
    }

    nextStep() {

        // Empty errors for this step
        this.state.errors[this.state.step] = [];

        // Gather validators on error placeholders
        let stepEl = this.wizardSteps[this.state.step];
        let errors =  this.state.errors[this.state.step];
        let validator = fireValidators(stepEl as any, errors);

        validator.then((res:boolean) => {

            if (!res) return false;

            // Chain main validator on the step itself
            if (stepEl.props.validator) {
                return stepEl.props.validator().then(res => {
                    if (res == null) {
                        return true;
                    } else {
                        errors.push(...res);
                        return false;
                    }
                });
            } else {
                return true;
            }

        }).then((res:boolean) => {

            // Force redraw / update of errors
            this.setState({errors:this.state.errors});

            // Show next step or call onValidate
            if (res) {
                if (this.state.step < this.wizardSteps.length - 1) {
                    this.setState({step: this.state.step + 1});
                } else {
                    this.props.onValidate();
                }
            }
        });
    }

    render() {
        let _ = this.props.messages;

        // Loop on steps, build the header
        let steps = React.Children.map(this.props.children, (child, index) =>
            <Step active={this.state.step == index} >
            <Step.Content >
                <Step.Title>{(child as any).props.title}</Step.Title>
            </Step.Content>
        </Step>);

        let currentStep = React.Children.map(this.props.children, (child, index) => index== this.state.step ? child : null);

        let errors =  this.state.errors[this.state.step];
        let lastStep = this.state.step == this.wizardSteps.length  - 1;

        return <div>
            <Step.Group attached="top" ordered>
                {steps}
            </Step.Group>
            <Segment attached="bottom">
                <ErrorsContext.Provider value={errors}>
                    {currentStep}

                    <RemainingErrorsPO messages={_} />

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
                </ErrorsContext.Provider>
            </Segment>

        </div>;
    }

}
