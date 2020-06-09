import {DOWNLOAD_JSON_URL, DOWNLOAD_XLS_URL} from "../shared/api";
import {Express} from "express";
import {AttributeDisplay, extractDisplays} from "../shared/views/display";
import {Record} from "../shared/model/instances";
import {applySearchAndFilters} from "../shared/views/filters";
import {DbDataFetcher} from "./db/db";
import {deepClone, Map} from "../shared/utils";
import {Workbook} from "exceljs";
import {Request, Response} from "express-serve-static-core"
import {attrLabel} from "../shared/jsx/utils/utils";
import {selectLanguage} from "./i18n/messages";
import {mergeErrors} from "../shared/validators/validators";

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
    let messages = selectLanguage(req).messages;
    let schema = (await dbDataFetcher.getDbDefinition(db_name, req.session.user, messages)).schema;
    let records = await dbDataFetcher.getRecords(db_name, req.session.user, messages);
    return applySearchAndFilters(records, query, schema);
}

/** Filter out hidden attributes on a JSON object  */
function filterObj(obj : Map<any>, displays : Map<AttributeDisplay>) {
    let res = deepClone(obj) as Map<any>;
    for (let key in res) {
        if (displays[key] == AttributeDisplay.HIDDEN) {
            delete res[key];
        }
    }
    return res;
}


async function exportAs(db_name:string, req:Request, res:Response, exportType: ExportType) {
    let messages = selectLanguage(req).messages;
    let dbDef = await new DbDataFetcher(req).getDbDefinition(db_name, req.session.user, messages);
    let displays = extractDisplays(dbDef.schema, req.query);
    let records = await getAllWithFilters(req, db_name, req.query);
    records = records.map(record => filterObj(record, displays));

    let filename = `${db_name}.${EXTENSION[exportType]}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", MIME_TYPES[exportType]);

    if (exportType == ExportType.EXCEL) {
        var workbook = new Workbook();
        let worksheet = workbook.addWorksheet("main");
        worksheet.columns = dbDef.schema.attributes
            .filter(attr => displays[attr.name] != AttributeDisplay.HIDDEN)
            .map(attr => ({header:attrLabel(attr), key:attr.name}));
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