/* popup controlling the sorting */
import {_} from "../../i18n/messages";
import {Button, Header, Icon} from "semantic-ui-react";
import * as React from "react";
import {RouteComponentProps} from "react-router";
import {attributesMap, StructType} from "../../model/types";
import {goTo, parseParams} from "../../utils";
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {SafePopup} from "../utils/ssr-safe";
import {attrLabel, ellipsis} from "../utils/utils";

interface SortProps extends RouteComponentProps<{}> {
    schema : StructType;
}

export const SortPopup : React.SFC<SortProps> = (props) => {

    let queryParams = parseParams(props.location.search)
    let sort = extractSort(queryParams);

    let setSort = (attrName:string, asc:boolean) => {
        let newSort : ISort = {key:attrName, asc};
        goTo(props, serializeSort(newSort));
    }

    let sortAttr = sort.key ? attributesMap(props.schema)[sort.key] : null;


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
                {ellipsis(attrLabel(sortAttr))} <Icon name={sort.asc ? "angle up" : "angle down"} />
            </span>
        </Button>} >

        <div style={{padding:"1em"}}>
            <Header as="h4">{_.sort_by}</Header>

            {props.schema.attributes.map(attr => {

                return <div key={attr.name} style={{paddingBottom:"0.5em"}}>
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
                                onClick={() => setSort(attr.name, false)} /> />
                    </Button.Group>

                    <span style={{marginLeft:"1em"}} ><b>{ellipsis(attrLabel(attr))}</b></span>

                </div>})}
        </div>

    </SafePopup>

};