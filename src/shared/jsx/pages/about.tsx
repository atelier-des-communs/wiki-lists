import * as React from "react";
import {Card, Container, Header, Icon, Image, SemanticICONS} from "semantic-ui-react";
import logoAtelierDesCommuns from "../../img/atelier-des-communs.png";


type IContent = {
    title:string,
    icon:SemanticICONS,
    description:JSX.Element | string
}

const content : IContent[] = [
    {
        title: "Quoi ?",
        icon:"building",
        description: <p>
            Ce site est une interface ergonomique à la
            base de donnée nationale <a href="https://www.data.gouv.fr/fr/datasets/base-des-permis-de-construire-sitadel/"><b>Sitadel</b></a> des permis de construire.
        </p>
    },
    {
        title: "Pourquoi ?",
        icon:"lightbulb",
        description: <p>
            L'objectif est de fournir un accès <b>facile et ergonomique</b> à une base de données stratégique et de
            fournir aux citoyens et associations un moyen simple d'effectuer une veille sur les projets de constructions
            impactant leur quotidien.
            <br/>
            <b>#OpenData</b> → <b>#ErgonomicData</b>
            </p>
    },
    {
        title: "Qui ?",
        icon:"address card",
        description: <><p>
            Ce site est une initative de <a href="https://atelier-des-communs.fr/">l'Atelier des communs {<Icon name="globe" />}</a>,
            un nième collectif <a href="https://raphael-jolivet.name" >unipersonnel</a> dont le but est de mettre
            l'informatique au service du bien commun.<br/>
            Vous pouvez nous (me) contacter à <a href="mailto:raphael@atelier-des-communs.fr">raphael@atelier-des-communs.fr</a>
        </p>
            <Image src={logoAtelierDesCommuns} size="medium" />
        </>
    },
    {
        title: "Comment ?",
        icon:"cogs",
        description: <p>
            Ce site est une adaptation de l'application <a href="https://github.com/atelier-des-communs/wiki-lists" >wiki-lists</a> :
            une plateforme open source de partage et d'édition collaborative de données structurées, développée par &nbsp;
            <a href="https://atelier-des-communs.fr/">l'Atelier des communs {<Icon name="globe" />}</a>.
            <br/>
            Les données proviennent de la base nationale <a href="https://www.data.gouv.fr/fr/datasets/base-des-permis-de-construire-sitadel/"><b>Sitadel</b></a>,
            enrichies formattées et géo-localisées par des <a href="https://github.com/atelier-des-communs/vigibati.fr">scripts développés pour l'occasion.</a>
        </p>
    },
    {
        title: "Limitations",
        icon : "warning",
        description : <>
            <p>
                Pour des raisons de respect de la vie privée, cette base de donnée contient <b>seulement les permis de personnes morales</b> :
                sociétés, collectivités ou SCI. Elle ne contient pas les permis de particuliers.
            </p>
            <p>
                La base de donnée est mise à jour avec un délai variable, pouvant aller <b>jusqu'à deux mois</b>, après dépot en mairie.
                Ce délai peut dépasser le délai légal de recours juridique (2 mois).
            </p>
            <p>
                Selon les mairies, les données fournies peuvent être <b>erronnées ou incomplètes</b>. La localisation peut être manquante ou imprécise.
                N'hésitez pas à consulter le permis complet en mairie.
            </p>
        </>
    },
    {
        title: "Mentions légales",
        icon : "balance scale",
        description : <>
            <p>
                Les informations présentes sur ce site sont fournies à titre informatif et n'engagent pas la responsabilié de l'auteur ou de l'hébergeur.
            </p>
            <p>
                Conformément à la loi informatique et libertés et aux règles édictées par la directive RGPD, vous avez un droit d'accès et de
                modification / suppression des informations personnelles vous concernant. Veuillez contacter <a href="mailto:raphael@atelier-des-communs.fr">raphael@atelier-des-communs.fr</a>.
            </p>
        </>
    },
    {
        title: "Soutien",
        icon : "money",
        description : <>
            <p>
                Ce service est fourni à titre gratuit.<br/>
                Vous pouvez toutefois soutenir ce projet, pour les frais d'hébergement et le développement de l'outil <a href="https://github.com/atelier-des-communs/wiki-lists" >wiki-lists</a>.
                <br/>
                Merci !
                <iframe src="//fr.tipeee.com/atelier-des-communs/embed/button" width="100%" height="30" style={{border:0}}>

                </iframe>
            </p>
        </>
    }
];

export class AboutPage extends React.PureComponent {
    render() {
        return <Container>
            <Header as="h1" >
                à propos
            </Header>
            <Card.Group>
                {
                    content.map(item => <Card>
                        <Card.Content>
                            <Card.Header style={{color:"teal"}} >
                                <Icon name={item.icon} />
                                {item.title}
                            </Card.Header>
                            <Card.Description>
                                {item.description}
                            </Card.Description>
                        </Card.Content>
                    </Card>)
                }
            </Card.Group>
        </Container>
    }
}

