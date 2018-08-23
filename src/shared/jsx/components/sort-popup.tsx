/* popup controlling the sorting */
import {_} from "../../i18n/messages";
import {Button, Icon} from "semantic-ui-react";
import * as React from "react";
import {RouteComponentProps} from "react-router";
import {StructType} from "../../model/types";
import {goTo, parseParams} from "../../utils";
import {AttributeDisplay, extractDisplays, serializeDisplay} from "../../views/display";
import {extractSort, ISort, serializeSort} from "../../views/sort";
import {SafePopup} from "../utils/ssr-safe";
import {ellipsis} from "../utils/utils";

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
                {ellipsis(sort.key)} <Icon name={sort.asc ? "angle up" : "angle down"} />
            </span>
        </Button>} >

        <div style={{padding:"1em"}}>
            {props.schema.attributes.map(attr => {

                return <div key={attr.name} style={{paddingBottom:"0.5em"}}>
                    <Button.Group basic compact size="small" as="span">
                        <Button icon="angle up"
                                compact size="small"
                                title={_.show_attribute}
                                active={sort.key == attr.name && sort.asc}
                                onClick={() => setSort(attr.name, true)} />
                        <Button icon="angle down"
                                compact size="small"
                                title={_.show_attribute}
                                active={sort.key == attr.name && !sort.asc}
                                onClick={() => setSort(attr.name, false)} /> />
                    </Button.Group>

                    <span style={{marginLeft:"1em"}} ><b>{ellipsis(attr.name)}</b></span>

                </div>})}
        </div>

    </SafePopup>

};