import { GridDataStore } from "../data/GridDataStore";
import { Viewport } from "./ViewPort";
import { Selection } from "./Selection";
import { GridConfig } from "../config/GridConfig";

export class GridRenderer {
    private context: CanvasRenderingContext2D;
    private dataStore: GridDataStore;
    private viewport: Viewport;
    private selection: Selection;

    constructor(
        context: CanvasRenderingContext2D,
        dataStore: GridDataStore,
        viewport: Viewport,
        selection: Selection
    ) {
        this.context = context;
        this.dataStore = dataStore;
        this.viewport = viewport;
        this.selection = selection;
    }

    public render(canvasWidth: number, canvasHeight: number): void {
        const visibleArea = this.viewport.getVisibleArea(canvasWidth, canvasHeight);

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

                if (drawX >= GridConfig.HEADER_WIDTH && drawY >= GridConfig.HEADER_HEIGHT) {
                    this.context.fillStyle = "#ffffff";
                    this.context.fillRect(drawX, drawY, colWidth, rowHeight);

                    this.context.strokeStyle = GridConfig.GRID_COLOR;
                    this.context.lineWidth = 1;
                    this.context.strokeRect(drawX, drawY, colWidth, rowHeight);

                    const value = this.dataStore.getCellValue(r, c);
                    if (value !== undefined && value !== null && value !== "") {
                        this.context.save();
                        this.context.beginPath();
                        this.context.rect(
                            drawX + GridConfig.CELL_PADDING,
                            drawY,
                            colWidth - (GridConfig.CELL_PADDING * 2),
                            rowHeight
                        );
                        this.context.clip();

                        this.context.fillStyle = GridConfig.CELL_TEXT;
                        this.context.fillText(String(value), drawX + GridConfig.CELL_PADDING, drawY + (rowHeight / 2));
                        this.context.restore();
                    }
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

        const startRow = Math.min(range.start.row, range.end.row);
        const endRow = Math.max(range.start.row, range.end.row);
        const startCol = Math.min(range.start.column, range.end.column);
        const endCol = Math.max(range.start.column, range.end.column);

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

        if (boxX + boxWidth >= GridConfig.HEADER_WIDTH && boxY + boxHeight >= GridConfig.HEADER_HEIGHT) {
            this.context.save();
            
            this.context.fillStyle = "rgba(16, 124, 65, 0.06)";
            this.context.fillRect(boxX, boxY, boxWidth, boxHeight);

            this.context.strokeStyle = GridConfig.ACTIVE_BORDER;
            this.context.lineWidth = 2;
            this.context.strokeRect(boxX, boxY, boxWidth, boxHeight);

            let activeX = GridConfig.HEADER_WIDTH;
            for(let c=0; c<activeCell.column; c++) activeX += this.dataStore.getColumn(c).width;
            activeX -= offsetX;

            let activeY = GridConfig.HEADER_HEIGHT;
            for(let r=0; r<activeCell.row; r++) activeY += this.dataStore.getRow(r).height;
            activeY -= offsetY;

            const activeW = this.dataStore.getColumn(activeCell.column).width;
            const activeH = this.dataStore.getRow(activeCell.row).height;

            if (activeX >= GridConfig.HEADER_WIDTH && activeY >= GridConfig.HEADER_HEIGHT) {
                this.context.strokeStyle = GridConfig.ACTIVE_BORDER;
                this.context.lineWidth = 1;
                this.context.strokeRect(activeX, activeY, activeW, activeH);
            }

            this.context.fillStyle = GridConfig.ACTIVE_BORDER;
            this.context.fillRect(boxX + boxWidth - 4, boxY + boxHeight - 4, 5, 5);

            this.context.restore();
        }
    }

    private drawHeaders(visibleArea: any, canvasWidth: number, canvasHeight: number): void {
        this.context.font = GridConfig.FONT;
        this.context.textBaseline = "middle";
        this.context.textAlign = "center";

        const offsetX = this.viewport.getScrollX();
        const offsetY = this.viewport.getScrollY();

        let runningX = GridConfig.HEADER_WIDTH;
        for (let c = 0; c < visibleArea.startColumn; c++) {
            runningX += this.dataStore.getColumn(c).width;
        }

        for (let c = visibleArea.startColumn; c <= visibleArea.endColumn; c++) {
            const colModel = this.dataStore.getColumn(c);
            const colWidth = colModel ? colModel.width : GridConfig.COLUMN_WIDTH;
            const drawX = runningX - offsetX;
            
            if (drawX >= GridConfig.HEADER_WIDTH) {
                this.context.fillStyle = GridConfig.HEADER_COLOR;
                this.context.fillRect(drawX, 0, colWidth, GridConfig.HEADER_HEIGHT);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(drawX, 0, colWidth, GridConfig.HEADER_HEIGHT);

                this.context.fillStyle = GridConfig.HEADER_TEXT;
                this.context.fillText(colModel.getName(), drawX + (colWidth / 2), GridConfig.HEADER_HEIGHT / 2);
            }
            runningX += colWidth;
        }

        let runningY = GridConfig.HEADER_HEIGHT;
        for (let r = 0; r < visibleArea.startRow; r++) {
            runningY += this.dataStore.getRow(r).height;
        }

        for (let r = visibleArea.startRow; r <= visibleArea.endRow; r++) {
            const rowModel = this.dataStore.getRow(r);
            const rowHeight = rowModel ? rowModel.height : GridConfig.ROW_HEIGHT;
            const drawY = runningY - offsetY;

            if (drawY >= GridConfig.HEADER_HEIGHT) {
                this.context.fillStyle = GridConfig.HEADER_COLOR;
                this.context.fillRect(0, drawY, GridConfig.HEADER_WIDTH, rowHeight);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(0, drawY, GridConfig.HEADER_WIDTH, rowHeight);

                this.context.fillStyle = GridConfig.HEADER_TEXT;
                this.context.fillText(String(r + 1), GridConfig.HEADER_WIDTH / 2, drawY + (rowHeight / 2));
            }
            runningY += rowHeight;
        }

        this.context.fillStyle = GridConfig.HEADER_COLOR;
        this.context.fillRect(0, 0, GridConfig.HEADER_WIDTH, GridConfig.HEADER_HEIGHT);
        this.context.strokeStyle = GridConfig.GRID_COLOR;
        this.context.strokeRect(0, 0, GridConfig.HEADER_WIDTH, GridConfig.HEADER_HEIGHT);
    }
}