import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../shared/api";
import {Express} from "express";
import {extractDisplays} from "../shared/views/display";
import {Record} from "../shared/model/instances";
import {applySearchAndFilters, extractFilters, extractSearch} from "../shared/views/filters";
import {DbDataFetcher} from "./db/db";
import {Map, sortBy} from "../shared/utils";
import {Workbook} from "exceljs";
import {Request, Response} from "express-serve-static-core"
import {attrLabel} from "../shared/jsx/utils/utils";
import {extractSort} from "../shared/views/sort";
import {cloneDeep} from "lodash";
import {AttributeDisplay} from "../shared/model/types";

enum ExportType {
    JSON = "json",
    EXCEL = "excel"}

const MIME_TYPES = {
    [ExportType.JSON] : "application/json",
    [ExportType.EXCEL] : "application/vnd.ms-excel"};

const EXTENSION = {
    [ExportType.JSON] : "json",
    [ExportType.EXCEL] : "xlsx"};


async function getAllWithFilters(req:Request, db_name:string, query:Map<string>) : Promise<Record[]> {
    let dbDataFetcher = new DbDataFetcher(req);
    let schema = (await dbDataFetcher.getDbDefinition(db_name)).schema;

    let sort = extractSort(query);
    let search = extractSearch(query);
    let filters = extractFilters(schema, query);

    return dbDataFetcher.getRecords(db_name, filters, search, sort);
}

/** Filter out hidden attributes on a JSON object  */
function filterObj(obj : Map<any>, displays : Map<boolean>) {
    let res = cloneDeep(obj) as Map<any>;
    for (let key in res) {
        if (!displays[key]) {
            delete res[key];
        }
    }
    return res;
}


async function exportAs(db_name:string, req:Request, res:Response, exportType: ExportType) {

    let dbDef = await new DbDataFetcher(req).getDbDefinition(db_name);
    let displays = extractDisplays(dbDef.schema, req.query, "summary");
    let records = await getAllWithFilters(req, db_name, req.query);
    records = records.map(record => filterObj(record, displays));

    let filename = `${db_name}.${EXTENSION[exportType]}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", MIME_TYPES[exportType]);

    if (exportType == ExportType.EXCEL) {
        var workbook = new Workbook();
        let worksheet = workbook.addWorksheet("main");
        worksheet.columns = dbDef.schema.attributes

            // Filter visible attributes only
            .filter(attr => displays[attr.name])

            .map(attr => ({header:attrLabel(attr, null), key:attr.name}));
        for (let record  of records) {
            worksheet.addRow(filterObj(record, displays));
        }
        workbook.xlsx.write(res).then();

    } else if (exportType == ExportType.JSON) {
        res.send(records);
    } else {
        throw new Error(`Export type not supported : ${exportType}`);
    }
}

export function setUp(server : Express) {
    server.get(DOWNLOAD_JSON_URL, function(req:Request, res:Response) {
        exportAs(req.params.db_name, req, res, ExportType.JSON);
    });

    server.get(DOWNLOAD_XLS_URL, function(req:Request, res:Response) {
        exportAs(req.params.db_name, req, res, ExportType.EXCEL);
    });
}