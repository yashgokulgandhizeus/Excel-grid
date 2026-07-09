import { GridConfig } from "../config/GridConfig";
import type{ VisibleArea } from "../utils/Types";

export class Viewport {

    private scrollX = 0;
    private scrollY = 0;

    public setScroll(x: number, y: number): void {

        this.scrollX = Math.max(0, x);
        this.scrollY = Math.max(0, y);
    }

    public getScrollX(): number {

        return this.scrollX;

    }

    public getScrollY(): number {

        return this.scrollY;

    }

    public getVisibleArea(
        canvasWidth: number,
        canvasHeight: number
    ): VisibleArea {

        const startRow = Math.floor(
            this.scrollY / GridConfig.ROW_HEIGHT
        );

        const startColumn = Math.floor(
            this.scrollX / GridConfig.COLUMN_WIDTH
        );

        const visibleRows =
            Math.ceil(canvasHeight / GridConfig.ROW_HEIGHT) + 2;

        const visibleColumns =
            Math.ceil(canvasWidth / GridConfig.COLUMN_WIDTH) + 2;

        return {

            startRow,

            endRow: Math.min(
                GridConfig.TOTAL_ROWS - 1,
                startRow + visibleRows
            ),

            startColumn,

            endColumn: Math.min(
                GridConfig.TOTAL_COLUMNS - 1,
                startColumn + visibleColumns
            )

        };

    }

}
