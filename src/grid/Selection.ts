import type {
    CellPosition,
    CellRange,
} from "../utils/Types";

import { SelectionType } from "../utils/Types";

export class Selection {

    private activeCell: CellPosition = {
        row: 0,
        column: 0
    };

    private selectionType: SelectionType =
        SelectionType.CELL;

    private selectedRange: CellRange = {
        start: {
            row: 0,
            column: 0
        },
        end: {
            row: 0,
            column: 0
        }
    };

    public setActiveCell(
        row: number,
        column: number
    ): void {

        this.activeCell = {
            row,
            column
        };

        this.selectionType = SelectionType.CELL;

        this.selectedRange = {
            start: { row, column },
            end: { row, column }
        };

    }

    public selectRow(row: number): void {

        this.selectionType = SelectionType.ROW;

        this.selectedRange = {
            start: {
                row,
                column: 0
            },
            end: {
                row,
                column: Number.MAX_SAFE_INTEGER
            }
        };

    }

    public selectColumn(column: number): void {

        this.selectionType = SelectionType.COLUMN;

        this.selectedRange = {
            start: {
                row: 0,
                column
            },
            end: {
                row: Number.MAX_SAFE_INTEGER,
                column
            }
        };

    }

    public selectRange(
        start: CellPosition,
        end: CellPosition
    ): void {

        this.selectionType = SelectionType.RANGE;

        this.selectedRange = {
            start,
            end
        };

    }

    public getActiveCell(): CellPosition {

        return this.activeCell;

    }

    public getSelectionType(): SelectionType {

        return this.selectionType;

    }

    public getRange(): CellRange {

        return this.selectedRange;

    }

}