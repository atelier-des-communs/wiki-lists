import { combineReducers, ActionCreatorsMapObject } from 'redux';

export { actions as counterActions, types as counterTypes } from './counter';
import { reducer as counter, initialState as counterState } from './counter';

export { actions as heroActions, types as heroTypes, selectors as heroSelectors } from './heroes';
import { reducer as heroes, initialState as heroesState } from './heroes';

export { actions as abilityActions, types as abilityTypes } from './abilities';
import { reducer as abilities, initialState as abilitiesState } from './abilities';

export interface IStoreState {
    counter: typeof counterState,
    abilities: typeof abilitiesState,
    heroes: typeof heroesState
};

export default combineReducers({ counter, heroes, abilities });