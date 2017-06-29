import { IHero, ISuperAbility } from '../../../../interfaces';
import { NONE, ADD_HERO, REMOVE_HERO, ADD_ABILITY_TO_HERO, REMOVE_ABILITY_TO_HERO } from './types';
import { ActionCreator, Action, ActionCreatorsMapObject } from 'redux';

export interface IHeroAction extends Action {
    hero?: IHero;
    heroId?: number;
    abilityId?: number;
}


const addHero: ActionCreator<IHeroAction> = (hero: IHero) => ({ type: ADD_HERO, hero: hero });
const removeHero: ActionCreator<IHeroAction> = (heroId: number) => ({ type: REMOVE_HERO, heroId: heroId });
const addAbilityToHero: ActionCreator<IHeroAction> = (heroId: number, abilityId: number) => ({type: ADD_ABILITY_TO_HERO, heroId, abilityId});
const removeAbilityToHero: ActionCreator<IHeroAction> = (heroId: number, abilityId: number) => ({type: REMOVE_ABILITY_TO_HERO, heroId, abilityId});

const actions: ActionCreatorsMapObject = {
    addHero,
    removeHero,
    addAbilityToHero,
    removeAbilityToHero
}

export default actions; 