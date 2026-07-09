// src/grid/ViewPort.ts
import { GridConfig } from "../config/GridConfig";
import type { VisibleArea } from "../utils/Types";

export class Viewport {
    private scrollX = 0;
    private scrollY = 0;

    public setScroll(x: number, y: number): void {
        this.scrollX = Math.max(0, x);
        this.scrollY = Math.max(0, y);
    }

    public getScrollX(): number { return this.scrollX; }
    public getScrollY(): number { return this.scrollY; }

    public getVisibleArea(canvasWidth: number, canvasHeight: number): VisibleArea {
        // Find exact start indices by dividing scroll offset by standard cell sizes
        const startRow = Math.floor(this.scrollY / GridConfig.ROW_HEIGHT);
        const startColumn = Math.floor(this.scrollX / GridConfig.COLUMN_WIDTH);

        // Calculate how many rows/columns can physically fit onto the screen
        const visibleRowsCount = Math.ceil((canvasHeight - GridConfig.HEADER_HEIGHT) / GridConfig.ROW_HEIGHT) + 1;
        const visibleColumnsCount = Math.ceil((canvasWidth - GridConfig.HEADER_WIDTH) / GridConfig.COLUMN_WIDTH) + 1;

        return {
            startRow,
            endRow: Math.min(GridConfig.TOTAL_ROWS - 1, startRow + visibleRowsCount),
            startColumn,
            endColumn: Math.min(GridConfig.TOTAL_COLUMNS - 1, startColumn + visibleColumnsCount)
        };
    }
}
