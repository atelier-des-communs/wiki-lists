export interface IHero {
    id: number;
    name: string;
    alterEgo: string;
    colorPants: "red" | "green" | "black";
    abilities: number[]
}

export interface IHeroes {
    [id: number]: IHero
}