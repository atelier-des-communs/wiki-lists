/* popup controlling the sorting */
import {Button, Header, Icon} from "semantic-ui-react";
import * as React from "react";
import {RouteComponentProps} from "react-router";
import {Attribute, attributesMap, StructType} from "../../model/types";
import {goTo, goToResettingPage, parseParams} from "../../utils";
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {SafePopup} from "../utils/ssr-safe";
import {attrLabel, ellipsis} from "../utils/utils";
import {IMessages} from "../../i18n/messages";

interface SortProps extends RouteComponentProps<{}> {
    schema : StructType;
    messages:IMessages;
}

export const SortPopup : React.SFC<SortProps> = (props) => {

    let queryParams = parseParams(props.location.search);
    let sort = extractSort(queryParams);
    let {schema} = props;
    let _ = props.messages;

    let mainAttributes = props.schema.attributes.filter(attr => attr.display.summary);

    let setSort = (attrName:string, asc:boolean) => {
        let newSort : ISort = {key:attrName, asc};
        goToResettingPage(props, serializeSort(newSort));
    };

    let sortAttr = sort.key ? attributesMap(schema)[sort.key] : null;


    let singleAttrSort = (attr: Attribute) =>
        <div key={attr.name} style={{paddingBottom:"0.5em"}}>
            <Button.Group basic compact size="small" as="span">
                <Button icon="angle up"
                        compact size="small"
                        title={_.sort_asc}
                        active={sort.key == attr.name && sort.asc}
                        onClick={() => setSort(attr.name, true)} />

                <Button icon="angle down"
                        compact size="small"
                        title={_.sort_desc}
                        active={sort.key == attr.name && !sort.asc}
                        onClick={() => setSort(attr.name, false)} />
            </Button.Group>
        <span style={{marginLeft:"1em"}} ><b>{ellipsis(attrLabel(attr, _))}</b></span>
    </div>;

    return <SafePopup wide="very"
        // Force to redraw (and hence close) upon update
        key={Date.now()}
        trigger={
        <Button
            title={_.sort_by}
            labelPosition="left"
            icon="sort amount down" >
            <Icon name="sort amount down" />
            <span>
                {ellipsis(attrLabel(sortAttr, _))} <Icon name={sort.asc ? "angle up" : "angle down"} />
            </span>
        </Button>} >

        <div style={{padding:"1em"}}>
            <Header as="h3">{_.sort_by}</Header>

            {mainAttributes
                .filter(attr => !attr.system)
                .map(singleAttrSort)}

            <Header as="h4">{_.system_attributes}</Header>

            {props.schema.attributes
                .filter(attr => attr.system)
                .map(singleAttrSort)}}
        </div>

    </SafePopup>

};