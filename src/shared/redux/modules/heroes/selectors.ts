import { createSelector, Selector, ParametricSelector } from 'reselect';
import { IStoreState } from './../../index';
import { IHero, IHeroes, ISuperAbility } from '../../../../interfaces';

const getHero: ParametricSelector<IStoreState, number, IHero> = (state: IStoreState, id: number) => state.heroes[id];
const getHeroes: Selector<IStoreState, IHero[]> = (state: IStoreState) => Object.keys(state.heroes).map(heroId => state.heroes[Number(heroId)]);
const getHeroAbilities: ParametricSelector<IStoreState, number, ISuperAbility[]> = (state: IStoreState, heroId: number) => state.heroes[heroId].abilities.map(abilityId => state.abilities[Number(abilityId)]);

const selectors = {
    getHero: createSelector(
        getHero,
        hero => hero
    ),
    getHeroesNames: createSelector(
        getHeroes,
        heroes => heroes
    ),
    getHeroAbilities: createSelector(
        getHeroAbilities,
        abilities => abilities
    )
}

export default selectors;