export interface CellPosition {
    row: number;
    column: number;
}

export interface CellRange {
    start: CellPosition;
    end: CellPosition;
}

export interface VisibleArea {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
}

export interface SummaryData {
    count: number;
    sum: number;
    min: number;
    max: number;
    average: number;
}

export const SelectionType = {
    CELL: 'CELL',
    ROW: 'ROW',
    COLUMN: 'COLUMN',
    RANGE: 'RANGE'
} as const;

export type SelectionType = typeof SelectionType[keyof typeof SelectionType];
