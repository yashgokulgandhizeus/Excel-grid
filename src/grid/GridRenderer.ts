// src/grid/GridRenderer.ts

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

    /**
     * Master render orchestration pipeline
     */
    public render(canvasWidth: number, canvasHeight: number): void {
        const visibleArea = this.viewport.getVisibleArea(canvasWidth, canvasHeight);

        // 1. Wipe the workspace clean
        this.clearCanvas(canvasWidth, canvasHeight);

        // 2. Draw base cell grids and textual values
        this.drawCellsAndGridLines(visibleArea);

        // 3. Draw active range highlights and boundaries 
        this.drawSelectionBorder(visibleArea);

        // 4. Draw fixed layout context headers on top layer
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

        for (let r = visibleArea.startRow; r <= visibleArea.endRow; r++) {
            // Calculate absolute canvas layout screen Y coordinate point
            const currentY = GridConfig.HEADER_HEIGHT + (r * GridConfig.ROW_HEIGHT) - offsetY;

            for (let c = visibleArea.startColumn; c <= visibleArea.endColumn; c++) {
                // Calculate absolute canvas layout screen X coordinate point
                const currentX = GridConfig.HEADER_WIDTH + (c * GridConfig.COLUMN_WIDTH) - offsetX;

                // Stop drawing if the cell falls behind the sticky side/top headers
                if (currentX < GridConfig.HEADER_WIDTH || currentY < GridConfig.HEADER_HEIGHT) {
                    continue;
                }

                // Render inner cell background block
                this.context.fillStyle = "#ffffff";
                this.context.fillRect(currentX, currentY, GridConfig.COLUMN_WIDTH, GridConfig.ROW_HEIGHT);

                // Draw bounding cell frame gridlines
                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(currentX, currentY, GridConfig.COLUMN_WIDTH, GridConfig.ROW_HEIGHT);

                // Fetch data text mapping fields
                const value = this.dataStore.getCellValue(r, c);
                if (value !== undefined && value !== null && value !== "") {
                    this.context.save();
                    this.context.beginPath();
                    
                    // Safely clip text to keep long words/numbers inside cell borders
                    this.context.rect(
                        currentX + GridConfig.CELL_PADDING,
                        currentY,
                        GridConfig.COLUMN_WIDTH - (GridConfig.CELL_PADDING * 2),
                        GridConfig.ROW_HEIGHT
                    );
                    this.context.clip();

                    this.context.fillStyle = GridConfig.CELL_TEXT;
                    this.context.fillText(
                        String(value),
                        currentX + GridConfig.CELL_PADDING,
                        currentY + (GridConfig.ROW_HEIGHT / 2)
                    );
                    this.context.restore();
                }
            }
        }
    }

    private drawSelectionBorder(visibleArea: any): void {
        const range = this.selection.getRange(); // Pulls structural start and end bounding points
        const activeCell = this.selection.getActiveCell();
        const offsetX = this.viewport.getScrollX();
        const offsetY = this.viewport.getScrollY();

        // Normalize coordinates so dragging upwards/backwards doesn't break calculations
        const startRow = Math.min(range.start.row, range.end.row);
        const endRow = Math.max(range.start.row, range.end.row);
        const startCol = Math.min(range.start.column, range.end.column);
        const endCol = Math.max(range.start.column, range.end.column);

        // Calculate absolute screen bounds for top-left intersection corner element mapping point
        const boxX = GridConfig.HEADER_WIDTH + (startCol * GridConfig.COLUMN_WIDTH) - offsetX;
        const boxY = GridConfig.HEADER_HEIGHT + (startRow * GridConfig.ROW_HEIGHT) - offsetY;

        // Multiply structural counts to resolve complete layout box width and height parameters 
        const totalColsCount = (endCol - startCol) + 1;
        const totalRowsCount = (endRow - startRow) + 1;
        const boxWidth = totalColsCount * GridConfig.COLUMN_WIDTH;
        const boxHeight = totalRowsCount * GridConfig.ROW_HEIGHT;

        // Draw the overall highlighted bounding selection frame across canvas surface if visible
        if (boxX + boxWidth >= GridConfig.HEADER_WIDTH && boxY + boxHeight >= GridConfig.HEADER_HEIGHT) {
            this.context.save();
            
            // 1. Soft semi-transparent green background tint across selected cells range array surfaces
            this.context.fillStyle = "rgba(16, 124, 65, 0.06)";
            this.context.fillRect(boxX, boxY, boxWidth, boxHeight);

            // 2. Thick solid green boundary border frame track outline line path properties configuration updates
            this.context.strokeStyle = GridConfig.ACTIVE_BORDER;
            this.context.lineWidth = 2;
            this.context.strokeRect(boxX, boxY, boxWidth, boxHeight);

            // 3. Highlight individual active editing cursor cell anchor coordinate box frame inside the massive selection
            const activeX = GridConfig.HEADER_WIDTH + (activeCell.column * GridConfig.COLUMN_WIDTH) - offsetX;
            const activeY = GridConfig.HEADER_HEIGHT + (activeCell.row * GridConfig.ROW_HEIGHT) - offsetY;
            if (activeX >= GridConfig.HEADER_WIDTH && activeY >= GridConfig.HEADER_HEIGHT) {
                this.context.strokeStyle = GridConfig.ACTIVE_BORDER;
                this.context.lineWidth = 1;
                this.context.strokeRect(activeX, activeY, GridConfig.COLUMN_WIDTH, GridConfig.ROW_HEIGHT);
            }

            // 4. Square spreadsheet Fill-Handle handle node block tracking indicator at bottom-right corner point
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

        // 1. Render Top Alphabet Column Headers Row Blocks
        for (let c = visibleArea.startColumn; c <= visibleArea.endColumn; c++) {
            const currentX = GridConfig.HEADER_WIDTH + (c * GridConfig.COLUMN_WIDTH) - offsetX;
            
            if (currentX >= GridConfig.HEADER_WIDTH) {
                this.context.fillStyle = GridConfig.HEADER_COLOR;
                this.context.fillRect(currentX, 0, GridConfig.COLUMN_WIDTH, GridConfig.HEADER_HEIGHT);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(currentX, 0, GridConfig.COLUMN_WIDTH, GridConfig.HEADER_HEIGHT);

                this.context.fillStyle = GridConfig.HEADER_TEXT;
                const colModel = this.dataStore.getColumn(c);
                const label = colModel ? colModel.getName() : "A";
                this.context.fillText(label, currentX + (GridConfig.COLUMN_WIDTH / 2), GridConfig.HEADER_HEIGHT / 2);
            }
        }

        // 2. Render Left Numeric Row Sidebars Column Blocks
        for (let r = visibleArea.startRow; r <= visibleArea.endRow; r++) {
            const currentY = GridConfig.HEADER_HEIGHT + (r * GridConfig.ROW_HEIGHT) - offsetY;

            if (currentY >= GridConfig.HEADER_HEIGHT) {
                this.context.fillStyle = GridConfig.HEADER_COLOR;
                this.context.fillRect(0, currentY, GridConfig.HEADER_WIDTH, GridConfig.ROW_HEIGHT);

                this.context.strokeStyle = GridConfig.GRID_COLOR;
                this.context.lineWidth = 1;
                this.context.strokeRect(0, currentY, GridConfig.HEADER_WIDTH, GridConfig.ROW_HEIGHT);

                this.context.fillStyle = GridConfig.HEADER_TEXT;
                this.context.fillText(String(r + 1), GridConfig.HEADER_WIDTH / 2, currentY + (GridConfig.ROW_HEIGHT / 2));
            }
        }

        // 3. Absolute Top-Left Origin Intersecting Static Spacer Corner Block
        this.context.fillStyle = GridConfig.HEADER_COLOR;
        this.context.fillRect(0, 0, GridConfig.HEADER_WIDTH, GridConfig.HEADER_HEIGHT);
        this.context.strokeStyle = GridConfig.GRID_COLOR;
        this.context.strokeRect(0, 0, GridConfig.HEADER_WIDTH, GridConfig.HEADER_HEIGHT);
    }
}
