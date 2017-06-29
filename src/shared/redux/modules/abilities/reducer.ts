import { NONE, ADD_ABILITY, REMOVE_ABILITY } from './types';
import { ISuperAbilities, ISuperAbility } from '../../../../interfaces';
import { IAbilityAction } from './actions';

export const initialState: ISuperAbilities = {
    1: {
        id: 1,
        name: 'flight'
    },
    2: {
        id: 2,
        name: 'super strength'
    },
    3: {
        id: 3,
        name: 'heat-emitting'
    },
    4: {
        id: 4,
        name: 'super technology'
    }
}

export function reducer(state = initialState, action: IAbilityAction = { type: NONE }): ISuperAbilities {
    switch (action.type) {
        case ADD_ABILITY:
            return {
                ...state,
                [action.ability.id]: action.ability
            };
        case REMOVE_ABILITY:
            return {
                ...state,
                [action.abilityId]: undefined
            };
        default:
            return state;
    }
}