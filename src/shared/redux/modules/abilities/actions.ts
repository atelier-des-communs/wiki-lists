import { ISuperAbilities, ISuperAbility } from '../../../../interfaces';
import { ActionCreator, Action, ActionCreatorsMapObject } from 'redux';
import { ADD_ABILITY, REMOVE_ABILITY } from './types';

export interface IAbilityAction extends Action {
    ability?: ISuperAbility;
    abilityId?: number;
}

const addAbility: ActionCreator<IAbilityAction> = (ability: ISuperAbility) => ({ type: ADD_ABILITY, ability });
const removeAbility: ActionCreator<IAbilityAction> = (abilityId: number) => ({ type: REMOVE_ABILITY, abilityId });

const actions: ActionCreatorsMapObject = {
    addAbility,
    removeAbility
};

export default actions; 