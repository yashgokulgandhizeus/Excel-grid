import { GridConfig } from "../config/GridConfig";
import { GridDataStore } from "../data/GridDataStore";
import type { VisibleArea } from "../utils/Types";

export class Viewport {
    private scrollX = 0;
    private scrollY = 0;

    public setScroll(x: number, y: number, dataStore: GridDataStore, maxWidth: number, maxHeight: number): void {
        const totalContentWidth = dataStore.getColumns().reduce((acc, c) => acc + c.width, 0);
        const totalContentHeight = dataStore.getRows().reduce((acc, r) => acc + r.height, 0);

        const maxScrollX = Math.max(0, totalContentWidth - maxWidth + GridConfig.HEADER_WIDTH);
        const maxScrollHeight = Math.max(0, totalContentHeight - maxHeight + GridConfig.HEADER_HEIGHT + GridConfig.SUMMARY_HEIGHT);

        this.scrollX = Math.max(0, Math.min(x, maxScrollX));
        this.scrollY = Math.max(0, Math.min(y, maxScrollHeight));
    }

    public getScrollX(): number { return this.scrollX; }
    public getScrollY(): number { return this.scrollY; }

    public getVisibleArea(canvasWidth: number, canvasHeight: number, dataStore: GridDataStore): VisibleArea {
        let runningY = 0;
        let startRow = 0;
        
        // Accurate lookup to locate the starting row inside the scroll window
        for (let r = 0; r < GridConfig.TOTAL_ROWS; r++) {
            const rowH = dataStore.getRow(r)?.height || GridConfig.ROW_HEIGHT;
            if (runningY + rowH > this.scrollY) {
                startRow = r;
                break;
            }
            runningY += rowH;
        }

        let runningX = 0;
        let startColumn = 0;
        
        // Accurate lookup to locate the starting column inside the scroll window
        for (let c = 0; c < GridConfig.TOTAL_COLUMNS; c++) {
            const colW = dataStore.getColumn(c)?.width || GridConfig.COLUMN_WIDTH;
            if (runningX + colW > this.scrollX) {
                startColumn = c;
                break;
            }
            runningX += colW;
        }

        // Safe lookahead padding buffer: subtract 2 items to protect partially scrolled out items
        startRow = Math.max(0, startRow - 2);
        startColumn = Math.max(0, startColumn - 2);

        // Track forward across dynamic sizes to establish real ending drawing bounds
        let endY = 0;
        for (let r = 0; r < startRow; r++) endY += dataStore.getRow(r)?.height || GridConfig.ROW_HEIGHT;
        let endRow = startRow;
        const availableHeight = canvasHeight - GridConfig.HEADER_HEIGHT;
        
        while (endY < this.scrollY + availableHeight && endRow < GridConfig.TOTAL_ROWS - 1) {
            endY += dataStore.getRow(endRow)?.height || GridConfig.ROW_HEIGHT;
            endRow++;
        }
        endRow = Math.min(GridConfig.TOTAL_ROWS - 1, endRow + 3); // Extra buffer rows

        let endX = 0;
        for (let c = 0; c < startColumn; c++) endX += dataStore.getColumn(c)?.width || GridConfig.COLUMN_WIDTH;
        let endColumn = startColumn;
        const availableWidth = canvasWidth - GridConfig.HEADER_WIDTH;

        while (endX < this.scrollX + availableWidth && endColumn < GridConfig.TOTAL_COLUMNS - 1) {
            endX += dataStore.getColumn(endColumn)?.width || GridConfig.COLUMN_WIDTH;
            endColumn++;
        }
        endColumn = Math.min(GridConfig.TOTAL_COLUMNS - 1, endColumn + 3); // Extra buffer columns

        return { startRow, endRow, startColumn, endColumn };
    }
}
