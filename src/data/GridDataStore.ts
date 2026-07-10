import { Cell } from "../model/Cell";
import { Column } from "../model/Column";
import { Row } from "../model/Row";
import { GridConfig } from "../config/GridConfig";
import { JsonLoader } from "./JsonLoader";

export class GridDataStore {

    private rows: Row[] = [];

    private columns: Column[] = [];

    private cells: Map<string, Cell> = new Map();

    constructor() {

        this.createRows();

        this.createColumns();

        this.loadJson();

    }

    private createRows(): void {

        for (let i = 0; i < GridConfig.TOTAL_ROWS; i++) {

            this.rows.push(new Row(i));

        }

    }

    private createColumns(): void { 

        for (let i = 0; i < GridConfig.TOTAL_COLUMNS; i++) {

            this.columns.push(new Column(i));

        }

    }

    private loadJson(): void {

        const loader = new JsonLoader();

        const records = loader.loadData();

        records.forEach((record, row) => {

            this.setCell(row, 0, record.id.toString());
            this.setCell(row, 1, record.firstName);
            this.setCell(row, 2, record.lastName);
            this.setCell(row, 3, record.age.toString());
            this.setCell(row, 4, record.salary.toString());

        });

    }

    private getKey(row: number, column: number): string {

        return `${row}-${column}`;

    }

    public setCell(row: number, column: number, value: string): void {

        const key = this.getKey(row, column);

        this.cells.set(key, new Cell(row, column, value));

    }

    public getCell(row: number, column: number): Cell | null {

        const key = this.getKey(row, column);

        return this.cells.get(key) || null;

    }

    public getCellValue(row: number, column: number): string {

        const cell = this.getCell(row, column);

        return cell ? cell.getValue() : "";

    }

    public getRow(index: number): Row {

        return this.rows[index];

    }

    public getColumn(index: number): Column {

        return this.columns[index];

    }

    public getRows(): Row[] {

        return this.rows;

    }

    public getColumns(): Column[] {

        return this.columns;

    }

}