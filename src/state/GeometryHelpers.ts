import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";

export class GeometryHelpers {
    public static getColumnAtX(grid: Grid, worldX: number): number {
        let runningX = 0;
        const totalCols = GridConfig.TOTAL_COLUMNS;
        for (let c = 0; c < totalCols; c++) {
            runningX += grid.getDataStore().getColumn(c).width;
            if (runningX > worldX) return c;
        }
        return totalCols - 1;
    }

    public static getRowAtY(grid: Grid, worldY: number): number {
        let runningY = 0;
        const totalRows = GridConfig.TOTAL_ROWS;
        for (let r = 0; r < totalRows; r++) {
            runningY += grid.getDataStore().getRow(r).height;
            if (runningY > worldY) return r;
        }
        return totalRows - 1;
    }

    public static getColResizeIndex(grid: Grid, mouseX: number): number | null {
        let currentX = GridConfig.HEADER_WIDTH - grid.getViewport().getScrollX();
        for (let c = 0; c < GridConfig.TOTAL_COLUMNS; c++) {
            currentX += grid.getDataStore().getColumn(c).width;
            if (Math.abs(mouseX - currentX) <= 5) return c;
        }
        return null;
    }

    public static getRowResizeIndex(grid: Grid, mouseY: number): number | null {
        let currentY = GridConfig.HEADER_HEIGHT - grid.getViewport().getScrollY();
        for (let r = 0; r < GridConfig.TOTAL_ROWS; r++) {
            currentY += grid.getDataStore().getRow(r).height;
            if (Math.abs(mouseY - currentY) <= 5) return r;
        }
        return null;
    }
}
