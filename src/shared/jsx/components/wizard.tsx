/** Generic Wizard component */
import * as React from "react";
import {GlobalContextProps} from "../context/global-context";
import {Button, Segment, Step} from "semantic-ui-react";
import {RemainingErrorsPlaceholder, ErrorsContext, getErrorPlaceholderValidators} from "../utils/validation-errors";
import {fireAllValidators, ValidationErrors, ValidationException, Validator} from "../../validators/validators";
import {emptyMap, Map} from "../../utils";

export interface WizardStepProps {
    title: string;
    validator? : Validator;
}

export interface WizardProps {
    onFinish : () => void; // Called upon sucessfull validation of last step
}

export const WizardStep : React.SFC<WizardStepProps> = (props) => {
    return <>
        {props.children}
        </>;
};

export class Wizard extends React.Component<GlobalContextProps & WizardProps> {

    state : {
        step: number,
        errors:  Map<ValidationErrors> // We separate validation errors per step
    };
    wizardSteps : React.Component<WizardStepProps>[];

    constructor(props:GlobalContextProps & WizardProps) {
        super(props);
        this.state = {step: 0, errors:{}};
        this.wizardSteps = React.Children.toArray(this.props.children) as any;

        // Init map of errors
        for (var i=0; i < this.wizardSteps.length; i++) {
            this.state.errors[i] = {};
        }
    }

    previousStep() {
        this.setState({step:this.state.step-1});
    }

    setErrors(validationErrors:ValidationErrors) {
        this.state.errors[this.state.step] = validationErrors;
        this.forceUpdate();
    }

    async nextStep() {

        // Init errors for current step
        this.state.errors[this.state.step] = {};

        // Gather validators on error placeholders
        let stepEl = this.wizardSteps[this.state.step];

        // Get all validators attached to placholders
        let validators = getErrorPlaceholderValidators(stepEl as any);

        // Fire all local validators
        let validationErrors = await fireAllValidators(validators);

        // Update errors and stop here
        if (!emptyMap(validationErrors)) {
            this.setErrors(validationErrors);
            return false;
        }

        // Global step validator
        let stepValidator = stepEl.props.validator;
        if (stepValidator) {
            validationErrors = await stepValidator();

            if (!emptyMap(validationErrors)) {
                this.setErrors(validationErrors);
                return false;
            }
        }

        // Show next step or call onFinish
        if (this.state.step < this.wizardSteps.length - 1) {
            this.setState({step: this.state.step + 1});
        } else {
            this.props.onFinish();
        }
        return true;
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

        // Filter current child according to current step
        let currentStep = React.Children.map(this.props.children, (child, index) => index == this.state.step ? child : null);

        let errors =  this.state.errors[this.state.step];
        let lastStep = this.state.step == this.wizardSteps.length  - 1;

        return <div>
            <Step.Group attached="top" ordered>
                {steps}
            </Step.Group>
            <Segment attached="bottom">

                <ErrorsContext.Provider value={{errors, displayedErrors:[]}}>

                    {currentStep}

                    <RemainingErrorsPlaceholder messages={_} />

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
