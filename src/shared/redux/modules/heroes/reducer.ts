import { IHero, IHeroes } from '../../../../interfaces';
import { NONE, ADD_HERO, REMOVE_HERO, ADD_ABILITY_TO_HERO, REMOVE_ABILITY_TO_HERO } from './types';
import { IHeroAction } from './actions';

export const initialState: IHeroes = {
    1: {
        id: 1,
        name: 'Superman',
        alterEgo: 'Clark Kent',
        colorPants: 'red',
        abilities: [1, 2, 3]
    },
    2: {
        id: 2,
        name: 'Batman',
        alterEgo: 'Bruce Wayne',
        colorPants: 'black',
        abilities: [4]
    },
    3: {
        id: 3,
        name: 'Wonder women',
        alterEgo: 'Diana Prince',
        colorPants: 'red',
        abilities: [1]
    }
}

import { Action } from "redux";

export function reducer(state = initialState, action: IHeroAction = { type: NONE }): IHeroes {
    switch (action.type) {
        case ADD_HERO:
            return {
                ...state,
                [action.hero.id]: action.hero
            };
        case REMOVE_HERO:
            return {
                ...state,
                [action.heroId]: undefined
            };

        case ADD_ABILITY_TO_HERO:
            return {
                ...state,
                [action.heroId]: {
                    ...state[action.heroId],
                    abilities: [...state[action.heroId].abilities, action.abilityId]
                }
            };
        case REMOVE_ABILITY_TO_HERO:
            return {
                ...state,
                [action.heroId]: {
                    ...state[action.heroId],
                    abilities: state[action.heroId].abilities.filter(abilityId => abilityId !== action.abilityId)
                }
            };
        default:
            return state;
    }
};