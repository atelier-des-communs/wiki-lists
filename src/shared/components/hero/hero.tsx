import * as React from 'react';
import { IHero, ISuperAbility } from './../../../interfaces';
import { heroSelectors } from './../../redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

export interface IHeroConnectStateProps {
    hero: IHero,
    abilities: ISuperAbility[]
}

const Hero = connect<IHeroConnectStateProps, void, RouteComponentProps<{ heroId: number }>>(
    (state, props) => ({
        hero: heroSelectors.getHero(state, props.match.params.heroId),
        abilities: heroSelectors.getHeroAbilities(state, props.match.params.heroId)
    })
)(({ hero, abilities }) => (
    <div>
        <h1>{hero.name}</h1>
        <p>Alter ego: {hero.alterEgo}</p>
        <div style={{ display: "inline-block" }}>Color pants: {hero.colorPants}</div>
        <div style={{ display: "inline-block", backgroundColor: hero.colorPants, width: 20, height: 20 }}></div>
        <h2>Abilities:</h2>
        {abilities.map(ability => (
            <div key={"ability_" + ability.id}>
                Ability: {ability.name}
            </div>))
        }
    </div>
));

export default Hero;