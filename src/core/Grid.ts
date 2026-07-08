import { Row } from "./Row";
import { Column } from "./Column";

export class Grid {
    public rows: Row[] = [];
    public columns: Column[] = [];
    public rowCount: number;
    public columnCount: number;

    constructor(rowCount: number, columnCount: number) {
        this.rowCount = rowCount;
        this.columnCount = columnCount;

        for (let i = 0; i < rowCount; i++) {
            this.rows.push(new Row(i));
        }

        for (let i = 0; i < columnCount; i++) {
            this.columns.push(new Column(i));
        }
    }
}
