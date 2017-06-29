import * as React from "react";
import { RouteComponentProps } from "react-router-dom"
import { connect } from "react-redux";
import { heroSelectors, IStoreState } from "../../redux";
import { IHero } from '../../../interfaces';
import { Link, Route } from 'react-router-dom';
import Hero from './../hero/hero';

export interface IHeroesConnectStateProps {
    heroes: IHero[]
};

const Heroes = connect<IHeroesConnectStateProps, void, RouteComponentProps<{}>>(
    (state: IStoreState) => ({ heroes: heroSelectors.getHeroesNames(state) })
)(({ heroes }) => (
    <div>
        <h1> Heroes: </h1>
        <nav>
            <ul>
                {heroes.map(hero => <li key={"hero_" + hero.id}><Link to={"/single/heroes/" + hero.id}>Link to {hero.name}</Link></li>)}
            </ul>
        </nav>
        <Route path={"/single/heroes/:heroId"} component={Hero} />
    </div>
));

export default Heroes;
