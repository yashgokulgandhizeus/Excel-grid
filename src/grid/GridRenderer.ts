import { GridDataStore } from "../data/GridDataStore";
import { Viewport } from "./ViewPort";
import { Selection } from "./Selection";
import { GridConfig } from "../config/GridConfig";

export class GridRenderer {
    private context: CanvasRenderingContext2D;
    private dataStore: GridDataStore;
    private viewport: Viewport;
    private selection: Selection;

    constructor(context: CanvasRenderingContext2D, dataStore: GridDataStore, viewport: Viewport, selection: Selection) {
        this.context = context;
        this.dataStore = dataStore;
        this.viewport = viewport;
        this.selection = selection;
    }

    public render(canvasWidth: number, canvasHeight: number): void {
        const visibleArea = this.viewport.getVisibleArea(canvasWidth, canvasHeight, this.dataStore);

        this.clearCanvas(canvasWidth, canvasHeight);
        this.drawCellsAndGridLines(visibleArea);
        this.drawSelectionBorder(visibleArea);
        this.drawHeaders(visibleArea, canvasWidth, canvasHeight);
    }

    private clearCanvas(width: number, height: number): void {
        this.context.fillStyle = "#ffffff";
        this.context.fillRect(0, 0, width, height);
    }

    private drawCellsAndGridLines(visibleArea: any): void {
        this.context.font = GridConfig.FONT;
        this.context.textBaseline = "middle";
        this.context.textAlign = "left";

        const offsetX = this.viewport.getScrollX();
        const offsetY = this.viewport.getScrollY();

        let runningY = GridConfig.HEADER_HEIGHT;
        for (let r = 0; r < visibleArea.startRow; r++) {
            runningY += this.dataStore.getRow(r).height;
        }

        for (let r = visibleArea.startRow; r <= visibleArea.endRow; r++) {
            const rowModel = this.dataStore.getRow(r);
            const rowHeight = rowModel ? rowModel.height : GridConfig.ROW_HEIGHT;
            const drawY = runningY - offsetY;

            let runningX = GridConfig.HEADER_WIDTH;
            for (let c = 0; c < visibleArea.startColumn; c++) {
                runningX += this.dataStore.getColumn(c).width;
            }

            for (let c = visibleArea.startColumn; c <= visibleArea.endColumn; c++) {
                const colModel = this.dataStore.getColumn(c);
                const colWidth = colModel ? colModel.width : GridConfig.COLUMN_WIDTH;
                const drawX = runningX - offsetX;

                // Draw cell matrix lines
                this.context.fillStyle = "#ffffff";
                this.context.fillRect(drawX, drawY, colWidth, rowHeight);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(drawX, drawY, colWidth, rowHeight);

                const value = this.dataStore.getCellValue(r, c);
                if (value !== undefined && value !== null && value !== "") {
                    this.context.save();
                    this.context.beginPath();
                    this.context.rect(drawX + GridConfig.CELL_PADDING, drawY, colWidth - (GridConfig.CELL_PADDING * 2), rowHeight);
                    this.context.clip();

                    this.context.fillStyle = GridConfig.CELL_TEXT;
                    this.context.fillText(String(value), drawX + GridConfig.CELL_PADDING, drawY + (rowHeight / 2));
                    this.context.restore();
                }
                runningX += colWidth;
            }
            runningY += rowHeight;
        }
    }

    private drawSelectionBorder(visibleArea: any): void {
        const range = this.selection.getRange();
        const activeCell = this.selection.getActiveCell();
        const offsetX = this.viewport.getScrollX();
        const offsetY = this.viewport.getScrollY();

        // Architectural Bug Fix: Safely clamp selection indexes to actual layout metrics
        const startRow = Math.max(0, Math.min(range.start.row, range.end.row));
        let endRow = Math.max(range.start.row, range.end.row);
        if (endRow === Number.MAX_SAFE_INTEGER) endRow = GridConfig.TOTAL_ROWS - 1;
        endRow = Math.min(GridConfig.TOTAL_ROWS - 1, endRow);

        const startCol = Math.max(0, Math.min(range.start.column, range.end.column));
        let endCol = Math.max(range.start.column, range.end.column);
        if (endCol === Number.MAX_SAFE_INTEGER) endCol = GridConfig.TOTAL_COLUMNS - 1;
        endCol = Math.min(GridConfig.TOTAL_COLUMNS - 1, endCol);

        let boxX = GridConfig.HEADER_WIDTH;
        for (let c = 0; c < startCol; c++) boxX += this.dataStore.getColumn(c).width;
        boxX -= offsetX;

        let boxY = GridConfig.HEADER_HEIGHT;
        for (let r = 0; r < startRow; r++) boxY += this.dataStore.getRow(r).height;
        boxY -= offsetY;

        let boxWidth = 0;
        for (let c = startCol; c <= endCol; c++) boxWidth += this.dataStore.getColumn(c).width;

        let boxHeight = 0;
        for (let r = startRow; r <= endRow; r++) boxHeight += this.dataStore.getRow(r).height;

        this.context.save();
        this.context.fillStyle = "rgba(16, 124, 65, 0.06)";
        this.context.fillRect(boxX, boxY, boxWidth, boxHeight);

        this.context.strokeStyle = GridConfig.ACTIVE_BORDER;
        this.context.lineWidth = 2;
        this.context.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Map internal cell highlight marker
        let activeX = GridConfig.HEADER_WIDTH;
        for (let c = 0; c < activeCell.column; c++) activeX += this.dataStore.getColumn(c).width;
        activeX -= offsetX;

        let activeY = GridConfig.HEADER_HEIGHT;
        for (let r = 0; r < activeCell.row; r++) activeY += this.dataStore.getRow(r).height;
        activeY -= offsetY;

        const activeW = this.dataStore.getColumn(activeCell.column).width;
        const activeH = this.dataStore.getRow(activeCell.row).height;

        if (activeX >= GridConfig.HEADER_WIDTH && activeY >= GridConfig.HEADER_HEIGHT) {
            this.context.strokeStyle = GridConfig.ACTIVE_BORDER;
            this.context.lineWidth = 1;
            this.context.strokeRect(activeX, activeY, activeW, activeH);
        }
        this.context.restore();
    }

    private drawHeaders(visibleArea: any, canvasWidth: number, canvasHeight: number): void {
        this.context.font = GridConfig.FONT;
        this.context.textBaseline = "middle";
        this.context.textAlign = "center";

        const offsetX = this.viewport.getScrollX();
        const offsetY = this.viewport.getScrollY();

        const range = this.selection.getRange();
        const selectionType = this.selection.getSelectionType();

        const startColRange = Math.min(range.start.column, range.end.column);
        const endColRange = range.end.column === Number.MAX_SAFE_INTEGER ? GridConfig.TOTAL_COLUMNS - 1 : Math.max(range.start.column, range.end.column);

        const startRowRange = Math.min(range.start.row, range.end.row);
        const endRowRange = range.end.row === Number.MAX_SAFE_INTEGER ? GridConfig.TOTAL_ROWS - 1 : Math.max(range.start.row, range.end.row);

        // 1. Column Top Header Layout Draw Loop
        let runningX = GridConfig.HEADER_WIDTH;
        for (let c = 0; c < visibleArea.startColumn; c++) runningX += this.dataStore.getColumn(c).width;

        for (let c = visibleArea.startColumn; c <= visibleArea.endColumn; c++) {
            const colModel = this.dataStore.getColumn(c);
            const colWidth = colModel ? colModel.width : GridConfig.COLUMN_WIDTH;
            const drawX = runningX - offsetX;

            if (drawX >= GridConfig.HEADER_WIDTH) {
                // Determine highlight style configurations if entire column tracks active selection range
                const isColSelected = (selectionType === 'COLUMN' || selectionType === 'RANGE') && (c >= startColRange && c <= endColRange);

                this.context.fillStyle = isColSelected ? GridConfig.SELECTION_COLOR : GridConfig.HEADER_COLOR;
                this.context.fillRect(drawX, 0, colWidth, GridConfig.HEADER_HEIGHT);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(drawX, 0, colWidth, GridConfig.HEADER_HEIGHT);

                this.context.fillStyle = isColSelected ? GridConfig.ACTIVE_BORDER : GridConfig.HEADER_TEXT;
                this.context.fillText(colModel.getName(), drawX + (colWidth / 2), GridConfig.HEADER_HEIGHT / 2);
            }
            runningX += colWidth;
        }

        // 2. Row Side Header Layout Draw Loop
        let runningY = GridConfig.HEADER_HEIGHT;
        for (let r = 0; r < visibleArea.startRow; r++) runningY += this.dataStore.getRow(r).height;

        for (let r = visibleArea.startRow; r <= visibleArea.endRow; r++) {
            const rowModel = this.dataStore.getRow(r);
            const rowHeight = rowModel ? rowModel.height : GridConfig.ROW_HEIGHT;
            const drawY = runningY - offsetY;

            if (drawY >= GridConfig.HEADER_HEIGHT) {
                // Determine highlight style configurations if entire row tracks active selection range
                const isRowSelected = (selectionType === 'ROW' || selectionType === 'RANGE') && (r >= startRowRange && r <= endRowRange);

                this.context.fillStyle = isRowSelected ? GridConfig.SELECTION_COLOR : GridConfig.HEADER_COLOR;
                this.context.fillRect(0, drawY, GridConfig.HEADER_WIDTH, rowHeight);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(0, drawY, GridConfig.HEADER_WIDTH, rowHeight);

                this.context.fillStyle = isRowSelected ? GridConfig.ACTIVE_BORDER : GridConfig.HEADER_TEXT;
                this.context.fillText(String(r + 1), GridConfig.HEADER_WIDTH / 2, drawY + (rowHeight / 2));
            }
            runningY += rowHeight;
        }

        this.context.fillStyle = GridConfig.HEADER_COLOR; this.context.fillRect(0, 0, GridConfig.HEADER_WIDTH, GridConfig.HEADER_HEIGHT); this.context.strokeStyle = GridConfig.GRID_COLOR; this.context.strokeRect(0, 0, GridConfig.HEADER_WIDTH, GridConfig.HEADER_HEIGHT);
    }
}