import { ActionCreator, Action, ActionCreatorsMapObject } from 'redux';
import { DECREMENT, INCREMENT } from './constants';

const increment: ActionCreator<Action> = () => ({ type: INCREMENT });

const decrement: ActionCreator<Action> = () => ({ type: DECREMENT });

const actions: ActionCreatorsMapObject = {
    increment,
    decrement
}

export default actions; 