import { GridDataStore } from "../data/GridDataStore";
import type{ CellRange, SummaryData } from "../utils/Types";

export class Summary {

    private dataStore: GridDataStore

    constructor(
        dataStore: GridDataStore
    ) {
        this.dataStore=dataStore;
    }

    public calculate(range: CellRange): SummaryData {

        let count = 0;
        let sum = 0;
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;

        const startRow = Math.min(
            range.start.row,
            range.end.row
        );

        const endRow = Math.max(
            range.start.row,
            range.end.row
        );

        const startColumn = Math.min(
            range.start.column,
            range.end.column
        );

        const endColumn = Math.max(
            range.start.column,
            range.end.column
        );

        for (let row = startRow; row <= endRow; row++) {

            for (
                let column = startColumn;
                column <= endColumn;
                column++
            ) {

                const value =
                    this.dataStore.getCellValue(row, column);

                const number = Number(value);

                if (!isNaN(number)) {

                    count++;

                    sum += number;

                    min = Math.min(min, number);

                    max = Math.max(max, number);

                }

            }

        }

        return {

            count,

            sum,

            min: count === 0 ? 0 : min,

            max: count === 0 ? 0 : max,

            average: count === 0 ? 0 : sum / count

        };

    }

}
