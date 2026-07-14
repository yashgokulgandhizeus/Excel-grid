import { GridRenderer } from "./GridRenderer";
import { GridDataStore } from "../data/GridDataStore";
import { Viewport } from "./ViewPort";
import { Selection } from "./Selection";
import { Editor } from "./Editor";
import { Summary } from "./Summary";
import { CommandManager } from "../commands/CommandManager";
import { GridConfig } from "../config/GridConfig";
import { ResizeColumnCommand } from "../commands/ResizeColumnCommand";
import { ResizeRowCommand } from "../commands/ResizeRowCommand";

interface ResizeState {
    type: 'COLUMN' | 'ROW';
    index: number;
    startSize: number;
    startMousePos: number;
}

export class Grid {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private renderer: GridRenderer;
    private dataStore: GridDataStore;
    private viewport: Viewport;
    private selection: Selection;
    private editor: Editor;
    private commandManager: CommandManager;
    private summaryCalculator: Summary;

    private width: number;
    private height: number;
    private isMouseDown = false;
    private resizeState: ResizeState | null = null;

    constructor(container: HTMLElement) {
        this.container = container;

        this.canvas = document.createElement("canvas");
        this.canvas.tabIndex = 0;
        this.canvas.style.outline = "none";
        this.container.appendChild(this.canvas);

        const ctx = this.canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas Context Not Supported");
        this.context = ctx;

        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.dataStore = new GridDataStore();
        this.viewport = new Viewport();
        this.viewport.setScroll(0, 0, this.dataStore, this.width, this.height);

        this.selection = new Selection();
        this.commandManager = new CommandManager();
        this.summaryCalculator = new Summary(this.dataStore);

        this.editor = new Editor(this.container, this.dataStore, this.commandManager, () => { this.render(); });
        this.renderer = new GridRenderer(this.context, this.dataStore, this.viewport, this.selection);
    }
    public init(): void {
        this.registerEvents();
        this.render();
    }

    public render(): void {
        this.renderer.render(this.width, this.height);
        this.updateSummary();
    }

    private updateSummary(): void {
        const currentRange = this.selection.getRange();
        
        // Architectural Crash Fix: Cleanly strip out infinite limits BEFORE sending to worker calculations
        const safeStartRow = Math.max(0, Math.min(currentRange.start.row, currentRange.end.row));
        let safeEndRow = Math.max(currentRange.start.row, currentRange.end.row);
        if (safeEndRow === Number.MAX_SAFE_INTEGER) {
            safeEndRow = GridConfig.TOTAL_ROWS - 1;
        }

        const safeStartCol = Math.max(0, Math.min(currentRange.start.column, currentRange.end.column));
        let safeEndCol = Math.max(currentRange.start.column, currentRange.end.column);
        if (safeEndCol === Number.MAX_SAFE_INTEGER) {
            safeEndCol = GridConfig.TOTAL_COLUMNS - 1;
        }

        const workerRange = {
            start: { row: safeStartRow, column: safeStartCol },
            end: { row: safeEndRow, column: safeEndCol }
        };

        const summaryData = this.summaryCalculator.calculate(workerRange);
        const summaryElement = document.querySelector(".summary-bar");
        if (summaryElement) {
            summaryElement.innerHTML = `
                <span><strong>Count:</strong> ${summaryData.count}</span>
                <span><strong>Sum:</strong> ${summaryData.sum}</span>
                <span><strong>Avg:</strong> ${summaryData.average.toFixed(2)}</span>
                <span><strong>Min:</strong> ${summaryData.min === Number.MAX_VALUE ? 0 : summaryData.min}</span>
                <span><strong>Max:</strong> ${summaryData.max === Number.MIN_VALUE ? 0 : summaryData.max}</span>
            `;
        }
    }

    private registerEvents(): void {
        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        window.addEventListener("mouseup", this.handleMouseUp);
        this.canvas.addEventListener("dblclick", this.handleDoubleClick);
        this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
        this.canvas.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("resize", this.handleResize);
    }

    private getColResizeHit(mouseX: number): { index: number } | null {
        let currentX = GridConfig.HEADER_WIDTH - this.viewport.getScrollX();
        for (let c = 0; c < GridConfig.TOTAL_COLUMNS; c++) {
            currentX += this.dataStore.getColumn(c).width;
            if (Math.abs(mouseX - currentX) <= 5) return { index: c };
        }
        return null;
    }

    private getRowResizeHit(mouseY: number): { index: number } | null {
        let currentY = GridConfig.HEADER_HEIGHT - this.viewport.getScrollY();
        for (let r = 0; r < GridConfig.TOTAL_ROWS; r++) {
            currentY += this.dataStore.getRow(r).height;
            if (Math.abs(mouseY - currentY) <= 5) return { index: r };
        }
        return null;
    }

    private getColumnAtX(worldX: number): number {
        let runningX = 0;
        for (let c = 0; c < GridConfig.TOTAL_COLUMNS; c++) {
            runningX += this.dataStore.getColumn(c).width;
            if (runningX > worldX) return c;
        }
        return GridConfig.TOTAL_COLUMNS - 1;
    }

    private getRowAtY(worldY: number): number {
        let runningY = 0;
        for (let r = 0; r < GridConfig.TOTAL_ROWS; r++) {
            runningY += this.dataStore.getRow(r).height;
            if (runningY > worldY) return r;
        }
        return GridConfig.TOTAL_ROWS - 1;
    }
    private handleMouseDown = (event: MouseEvent): void => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        this.editor.hide();
        this.canvas.focus();

        // 1. Column Header Intercept & Resizing/Selection Hook
        if (mouseY < GridConfig.HEADER_HEIGHT && mouseX >= GridConfig.HEADER_WIDTH) {
            const hit = this.getColResizeHit(mouseX);
            if (hit) {
                const colModel = this.dataStore.getColumn(hit.index);
                this.resizeState = { type: 'COLUMN', index: hit.index, startSize: colModel.width, startMousePos: event.clientX };
                return;
            }
            const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + this.viewport.getScrollX();
            const colIndex = this.getColumnAtX(absoluteWorldX);
            this.selection.selectColumn(colIndex);
            this.render();
            return;
        }

        // 2. Row Header Intercept & Resizing/Selection Hook
        if (mouseX < GridConfig.HEADER_WIDTH && mouseY >= GridConfig.HEADER_HEIGHT) {
            const hit = this.getRowResizeHit(mouseY);
            if (hit) {
                const rowModel = this.dataStore.getRow(hit.index);
                this.resizeState = { type: 'ROW', index: hit.index, startSize: rowModel.height, startMousePos: event.clientY };
                return;
            }
            const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + this.viewport.getScrollY();
            const rowIndex = this.getRowAtY(absoluteWorldY);
            this.selection.selectRow(rowIndex);
            this.render();
            return;
        }

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) return; 

        // 3. Central Grid Selection Hook
        this.isMouseDown = true;
        const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + this.viewport.getScrollX();
        const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + this.viewport.getScrollY();

        const targetColumn = this.getColumnAtX(absoluteWorldX);
        const targetRow = this.getRowAtY(absoluteWorldY);

        this.selection.setActiveCell(targetRow, targetColumn);
        this.render();
    };

    private handleMouseMove = (event: MouseEvent): void => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (this.resizeState) {
            if (this.resizeState.type === 'COLUMN') {
                const deltaX = event.clientX - this.resizeState.startMousePos;
                const newWidth = Math.max(GridConfig.MIN_COLUMN_WIDTH, this.resizeState.startSize + deltaX);
                this.dataStore.getColumn(this.resizeState.index).setWidth(newWidth);
            } else {
                const deltaY = event.clientY - this.resizeState.startMousePos;
                const newHeight = Math.max(GridConfig.MIN_ROW_HEIGHT, this.resizeState.startSize + deltaY);
                this.dataStore.getRow(this.resizeState.index).setHeight(newHeight);
            }
            this.render();
            return;
        }

        if (this.isMouseDown) {
            if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) return; 
            const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + this.viewport.getScrollX();
            const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + this.viewport.getScrollY();

            const currentColumn = this.getColumnAtX(absoluteWorldX);
            const currentRow = this.getRowAtY(absoluteWorldY);

            const startCell = this.selection.getActiveCell();
            this.selection.selectRange({ row: startCell.row, column: startCell.column }, { row: currentRow, column: currentColumn });
            this.render();
            return;
        }

        this.updateMouseCursor(mouseX, mouseY);
    };

    private handleMouseUp = (event: MouseEvent): void => {
        if (this.resizeState) {
            const currentSize = this.resizeState.type === 'COLUMN' 
                ? this.dataStore.getColumn(this.resizeState.index).width 
                : this.dataStore.getRow(this.resizeState.index).height;

            if (currentSize !== this.resizeState.startSize) {
                const command = this.resizeState.type === 'COLUMN'
                    ? new ResizeColumnCommand(this.dataStore.getColumn(this.resizeState.index), this.resizeState.startSize, currentSize)
                    : new ResizeRowCommand(this.dataStore.getRow(this.resizeState.index), this.resizeState.startSize, currentSize);
                this.commandManager.execute(command);
            }
        }
        this.isMouseDown = false;
        this.resizeState = null;
    };

    private handleDoubleClick = (event: MouseEvent): void => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) return;

        const cell = this.selection.getActiveCell();
        
        let targetX = GridConfig.HEADER_WIDTH - this.viewport.getScrollX();
        for (let c = 0; c < cell.column; c++) targetX += this.dataStore.getColumn(c).width;
        
        let targetY = GridConfig.HEADER_HEIGHT - this.viewport.getScrollY();
        for (let r = 0; r < cell.row; r++) targetY += this.dataStore.getRow(r).height;

        const w = this.dataStore.getColumn(cell.column).width;
        const h = this.dataStore.getRow(cell.row).height;

        this.editor.show(cell.row, cell.column, targetX, targetY, w, h);
    };
    private handleWheel = (event: WheelEvent): void => {
        event.preventDefault();
        const nextX = this.viewport.getScrollX() + event.deltaX;
        const nextY = this.viewport.getScrollY() + event.deltaY;
        this.viewport.setScroll(nextX, nextY, this.dataStore, this.width, this.height);
        this.render();
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        // Keyboard Undo shortcut mapping (Ctrl + Z)
        if (event.ctrlKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            this.commandManager.undo();
            this.render();
            return;
        }
        // Keyboard Redo shortcut mapping (Ctrl + Y)
        if (event.ctrlKey && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            this.commandManager.redo();
            this.render();
            return;
        }

        // Functional Requirement Mapping: Arrow Navigation Loops
        const active = this.selection.getActiveCell();
        let nextRow = active.row;
        let nextCol = active.column;
        let handleKey = false;

        if (event.key === "ArrowUp") { nextRow = Math.max(0, active.row - 1); handleKey = true; }
        else if (event.key === "ArrowDown") { nextRow = Math.min(GridConfig.TOTAL_ROWS - 1, active.row + 1); handleKey = true; }
        else if (event.key === "ArrowLeft") { nextCol = Math.max(0, active.column - 1); handleKey = true; }
        else if (event.key === "ArrowRight") { nextCol = Math.min(GridConfig.TOTAL_COLUMNS - 1, active.column + 1); handleKey = true; }

        if (handleKey) {
            event.preventDefault();
            this.selection.setActiveCell(nextRow, nextCol);
            this.ensureCellVisibility(nextRow, nextCol);
            this.render();
        }
    };

    private ensureCellVisibility(row: number, col: number): void {
        let cellLeft = 0; for (let c = 0; c < col; c++) cellLeft += this.dataStore.getColumn(c).width;
        let cellRight = cellLeft + this.dataStore.getColumn(col).width;

        let cellTop = 0; for (let r = 0; r < row; r++) cellTop += this.dataStore.getRow(r).height;
        let cellBottom = cellTop + this.dataStore.getRow(row).height;

        let scrX = this.viewport.getScrollX();
        let scrY = this.viewport.getScrollY();

        const usableW = this.width - GridConfig.HEADER_WIDTH;
        const usableH = this.height - GridConfig.HEADER_HEIGHT - GridConfig.SUMMARY_HEIGHT;

        if (cellLeft < scrX) scrX = cellLeft;
        else if (cellRight > scrX + usableW) scrX = cellRight - usableW;

        if (cellTop < scrY) scrY = cellTop;
        else if (cellBottom > scrY + usableH) scrY = cellBottom - usableH;

        this.viewport.setScroll(scrX, scrY, this.dataStore, this.width, this.height);
    }

    private handleResize = (): void => {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.render();
    };

    private updateMouseCursor(x: number, y: number): void {
        if (y < GridConfig.HEADER_HEIGHT && x >= GridConfig.HEADER_WIDTH && this.getColResizeHit(x)) {
            this.canvas.style.cursor = "col-resize";
        } else if (x < GridConfig.HEADER_WIDTH && y >= GridConfig.HEADER_HEIGHT && this.getRowResizeHit(y)) {
            this.canvas.style.cursor = "row-resize";
        } else {
            this.canvas.style.cursor = "default";
        }
    }
}
