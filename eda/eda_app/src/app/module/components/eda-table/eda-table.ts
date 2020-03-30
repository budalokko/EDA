import { Observable } from 'rxjs';
import { EdaColumn } from './eda-columns/eda-column';
import { EdaColumnText } from './eda-columns/eda-column-text';
import { AlertService } from '@eda/services/service.index';
import { EdaContextMenu } from '@eda/shared/components/eda-context-menu/eda-context-menu';
import { EdaTableHeaderGroup } from './eda-table-header-group';
import * as _ from 'lodash';
import { Column } from '@eda/models/model.index';
import { EdaColumnNumber } from './eda-columns/eda-column-number';

interface PivotTableSerieParams {
    mainCol: any,
    mainColLabel: string,
    mainColValues: Array<string>,
    aggregatedColLabels: Array<string>,
    pivotColsLabels: Array<string>,
    pivotCols: Array<Column>,
    oldRows: Array<any>,
    newCols: Array<any>
}

export class EdaTable {
    private _value: any[] = [];

    public cols: EdaColumn[] = [];
    public rows: number = 10;
    public search: boolean = false;
    public loading: boolean = false;
    public alertService: AlertService;
    public filteredValue: any[] | undefined;
    public headerGroup: EdaTableHeaderGroup[] = [];

    //Input switch
    public oldvalue: any[] = [];
    public oldcols: EdaColumn[] = [];
    public pivot: boolean = false;

    public contextMenu: EdaContextMenu = new EdaContextMenu({});
    public contextMenuRow: any;

    private lastFunctLoad: Observable<any>;

    public series: Array<any>;

    public constructor(init: Partial<EdaTable>) {
        Object.assign(this, init);

    }

    get value() {
        return this._value;
    }

    set value(values: any[]) {
        this.clear();
        this._value = values;
        /* Inicialitzar filtres */
        if (!_.isEmpty(this.value)) {
            _.forEach(this.cols, c => {
                if (!_.isNil(c.filter)) {
                    /* Obtenim tots els valors sense repetits d'aquella columna per inicialitzar el filtre */
                    c.filter.init(_.orderBy(_.uniq(_.map(this.value, c.field))));
                }
            });
        }
        if (this.pivot) {
            this.PivotTable();
        }
    }

    public clear() {
        this._value = [];
    }

    public onPage(event: { first, rows }): void {
        this.rows = event.rows;
    }

    public load(funct: Observable<any>) {
        this.clear();
        this.loading = true;
        this.lastFunctLoad = funct;
        return new Promise((resolve, reject) => {
            funct.subscribe(
                response => {
                    this.value = response;
                    this.loading = false;

                    resolve();
                },
                err => {
                    this.loading = false;
                    if (!_.isNil(this.alertService)) {
                        this.alertService.addError(err);
                    }
                    reject(err);
                },
            );
        });
    }

    public reload() {
        return this.load(this.lastFunctLoad);
    }


    public getFilteredValues() {
        const me = this;
        if (!me.filteredValue) {
            return me.value;
        } else {
            return me.filteredValue;
        }
    }

    public getValues() {
        return this.value;
    }

    public _showContextMenu(row: any) {
        this.contextMenu.showContextMenu();
        this.contextMenuRow = row;
    }

    public _hideContexMenu() {
        this.contextMenu.hideContextMenu();
        this.contextMenuRow = undefined;
    }

    public getContextMenuRow() {
        return this.contextMenuRow;
    }

    getColsInfo() {
        let out = { numeric: [], text: [], numericLabels: [], textLabels: [] }
        this.cols.forEach((col, index) => {
            if (col.type === "EdaColumnNumber") {
                out.numeric.push(index)
                out.numericLabels.push(col.header);
            } else {
                out.text.push(index)
                out.textLabels.push(col.header);
            }
        });
        return out;
    }
    PivotTable() {
        const colsInfo = this.getColsInfo();
        const oldRows = this.getValues();
        const seriesLabels = [];
        for (let i = 0; i < colsInfo.numeric.length; i++) {
            seriesLabels.push(Object.keys(oldRows[0])[colsInfo.numeric[i]]);
        }
        const rowsToMerge = [];
        const colsToMerge = [];
        let newLabels;
        seriesLabels.forEach((serie, index) => {
            let colsRows = this.buildPivotSerie(index);
            // console.log(colsRows)
            rowsToMerge.push(colsRows.rows);
            colsToMerge.push(colsRows.cols);
            if (index === 0) {
                newLabels = colsRows.newLabels; //new labels are equal for each serie, first execution is enough to get new labels
            }
        });
        newLabels.metricsLabels = colsInfo.numericLabels;
        this.buildHeaders(newLabels, colsInfo);
        this._value = this.mergeRows(rowsToMerge);
        this.cols = this.mergeColumns(colsToMerge);
    }
    /**
     * Build a serie to pivot (one serie per metric)
     * @param serieIndex 
     */
    buildPivotSerie(serieIndex: number) {
        const params = this.generatePivotParams();
        const mapTree = this.buildMainMap(params.mainColValues, params.newCols);
        const populatedMap = this.populateMap(mapTree, params.oldRows, params.mainColLabel, params.aggregatedColLabels[serieIndex], params.pivotColsLabels);
        let newRows = this.buildNewRows(populatedMap, params.mainColLabel, params.aggregatedColLabels[serieIndex]);
        let newColNames = this.getNewColumnsNames(newRows[0]).slice(1); //For left column we want user's name, not technical
        const tableColumns = [];
        tableColumns.push(new EdaColumnText({ header: params.mainCol.header, field: params.mainCol.field }));
        newColNames.forEach(col => {
            tableColumns.push(new EdaColumnNumber({ header: col, field: col }));
        });
        let newLabels = { mainLabel: '', seriesLabels: [], metricsLabels: [] };
        newLabels.mainLabel = params.mainColLabel;
        newLabels.seriesLabels = params.newCols.splice(1);
        return { cols: tableColumns, rows: newRows, newLabels: newLabels }
    }

    /**
     * Merges series rows in one set of rows
     * @param rowsToMerge 
     */
    mergeRows(rowsToMerge: any) {
        const NUM_ROWS_IN_SERIES = rowsToMerge[0].length;
        const NUM_SERIES = rowsToMerge.length;
        const rows = [];
        for (let row = 0; row < NUM_ROWS_IN_SERIES; row++) {
            let newRow = {};
            for (let serie = 0; serie < NUM_SERIES; serie++) {
                newRow = { ...newRow, ...rowsToMerge[serie][row] }
            }
            rows.push(newRow);
        }
        return rows;
    }

    /**
     * Merges series columns in one set of columns
     * @param colsToMerge 
     */
    mergeColumns(colsToMerge: any) {
        const NUM_COLS = colsToMerge[0].length;
        let cols = [colsToMerge[0][0]];  //first column is the same for each serie
        for (let col = 1; col < NUM_COLS; col++) {
            colsToMerge.forEach(serie => {
                cols.push(serie[col])
            });
        }
        return cols
    }

    /**
     * Builds main map to store data classified by labels in tree format
     */
    buildMainMap(mainColLabels: Array<string>, newCols: Array<Array<string>>) {
        let newArray = newCols;
        newArray.unshift(mainColLabels);
        return this.buildMapRecursive(newArray);
    }
    /**
     * Returns a Map; every key has a map as value with all values passed as parameter as keys and 0 as values
     */
    buildSubMapTree(keys: Array<any>, values: any) {
        let out = new Map();
        keys.forEach(key => {
            let valuesMap = new Map();
            values.forEach(value => {
                valuesMap.set(value, 0);
            });
            out.set(key, valuesMap);
        });
        return out;
    }
    /**
     * Build a map of maps recursively
     * @param cols 
     */
    buildMapRecursive(cols: Array<Array<string>>) {
        let map = new Map();
        if (cols.length === 2) {
            return this.buildSubMapTree(cols[0], cols[1]);
        } else {
            const unsetCols = cols.slice(1);
            cols[0].forEach(col => {
                map.set(col, this.buildMapRecursive(unsetCols));
            });
        }
        return map;
    }

    /**
     * Puts values in the tree map
     */
    populateMap(map: Map<string, any>, rows: any, mainColLabel: string, aggregatedColLabel: string, pivotColsLabels: any) {
        rows.forEach(row => {
            const value = row[aggregatedColLabel];
            const pivotSteps = pivotColsLabels.length - 1;
            const leftColTarget = map.get(row[mainColLabel]);
            let lastMapKey = leftColTarget;
            let i;
            for (i = 0; i < pivotSteps; i++) {
                lastMapKey = lastMapKey.get(row[pivotColsLabels[i]]);
            }
            const actualValue = lastMapKey.get(row[pivotColsLabels[i]]);
            lastMapKey.set(row[pivotColsLabels[i]], actualValue + value);
        });
        return map;
    }

    /**
     * Builds new rows given a tree map
     */
    buildNewRows(map: Map<string, any>, mainColLabel: string, serieLabel: string) {
        let rows = [];
        map.forEach((value, key) => {
            let row = {};
            row[mainColLabel] = key;
            let pivotedCols = this.buildNewRowsRecursive(value, '', [], serieLabel);
            pivotedCols.forEach(col => {
                row[col.label] = col.value;
            });
            rows.push(row);
        });
        return rows;
    }
    /**
     * Buils new rows recursively (iterating over the tree until last nodes are found)
     * @param map 
     * @param colLabel 
     * @param row 
     * @param serieLabel 
     */
    buildNewRowsRecursive(map: Map<string, any>, colLabel: string, row: any, serieLabel: string) {
        map.forEach((value, key) => {
            if (typeof value !== 'object') {
                let label = `${colLabel} - ${key} - ${serieLabel}`;
                label = label.substr(2)
                row.push({ label: label, value: value });
                return
            } else {
                this.buildNewRowsRecursive(value, `${colLabel} - ${key}`, row, serieLabel);
            }
        });
        return row;
    }
    getNewColumnsNames(sampleRow: any) {
        return Object.keys(sampleRow);
    }

    /**
     * Generates params to build crosstable
     */
    generatePivotParams(): PivotTableSerieParams {
        //get old rows to build new ones
        const oldRows = this.getValues();
        //get index for numeric and text/date columns
        const typesIndex = this.getColsInfo();
        //Get left column 
        const mainCol = this.cols[typesIndex.text[0]];
        const mainColLabel = Object.keys(oldRows[0])[typesIndex.text[0]];
        const mainColValues = _.orderBy(_.uniq(_.map(this.value, mainCol.field)));
        //get aggregation columns
        const aggregatedColLabels = [];
        for (let i = 0; i < typesIndex.numeric.length; i++) {
            aggregatedColLabels.push(Object.keys(oldRows[0])[typesIndex.numeric[i]]);
        }
        //get pivot columns
        const pivotCols = [];
        const pivotColsLabels = [];
        for (let i = 1; i < typesIndex.text.length; i++) {
            pivotCols.push(this.cols[typesIndex.text[i]]);
            pivotColsLabels.push(Object.keys(oldRows[0])[typesIndex.text[i]]);
        }
        //get distinct values of pivot columns (new-columns names)
        const newCols = [];
        pivotCols.forEach(pivotCol => {
            newCols.push(_.orderBy(_.uniq(_.map(this.value, pivotCol.field))));
        });

        const params = {
            mainCol: mainCol,
            mainColLabel: mainColLabel,
            mainColValues: mainColValues,
            aggregatedColLabels: aggregatedColLabels,
            pivotColsLabels: pivotColsLabels,
            pivotCols: pivotCols,
            oldRows: oldRows,
            newCols: newCols
        }
        return params
    }

    /**
     * 
     * @param labels labels to set headers
     * @param colsInfo contains userName for main column
     */
    buildHeaders(labels: any, colsInfo: any) {

        let series = [];
        const numRows = labels.seriesLabels.length + 1 //1 for metrics labels
        let numCols = 1;
        labels.seriesLabels.forEach(label => {
            numCols *= label.length;
        });
        numCols *= labels.metricsLabels.length;
        //Main header props (incuding first label headers row)
        let mainColHeader = { title: colsInfo.textLabels[0], rowspan: numRows, colspan: 1 }
        series.push({ labels: [mainColHeader] });

        //if there is only one metric the metric is the header
        if (labels.metricsLabels.length > 1) {
            for (let i = 0; i < labels.seriesLabels[0].length; i++) {
                series[0].labels.push({ title: labels.seriesLabels[0][i], rowspan: 1, colspan: numCols / labels.seriesLabels[0].length })
            }
        } else {
            series[0].labels.push({ title: labels.metricsLabels[0], rowspan: 1, colspan: numCols });
            let serie = { labels: [] };
            for (let i = 0; i < labels.seriesLabels[0].length; i++) {
                serie.labels.push({ title: labels.seriesLabels[0][i], rowspan: 1, colspan: numCols / labels.seriesLabels[0].length })
            }
            series.push(serie);
        }
        //labels headers props
        let mult = labels.seriesLabels[0].length;
        let colspanDiv = numCols / labels.seriesLabels[0].length;
        for (let i = 1; i < labels.seriesLabels.length; i++) {
            let serie = { labels: [] };
            for (let j = 0; j < labels.seriesLabels[i].length * mult; j++) {
                serie.labels.push({ title: labels.seriesLabels[i][j % labels.seriesLabels[i].length], rowspan: 1, colspan: colspanDiv / labels.seriesLabels[i].length });
            }
            series.push(serie);
            mult *= labels.seriesLabels[i].length;
            colspanDiv = colspanDiv / labels.seriesLabels[i].length;
        }
        //metrics headers props ->  again, if there is only one metric the metric is the header
        if (labels.metricsLabels.length > 1) {
            let serie = { labels: [] }
            for (let i = 0; i < numCols; i++) {
                serie.labels.push({ title: labels.metricsLabels[i % labels.metricsLabels.length], rowspan: 1, colspan: 1 })
            }
            series.push(serie)
        }
        this.series = series;
    }

}
