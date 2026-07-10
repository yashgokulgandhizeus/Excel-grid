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
        if (!ctx) {
            throw new Error("Canvas Context Not Supported");
        }
        this.context = ctx;

        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.dataStore = new GridDataStore();
        this.viewport = new Viewport();
        this.viewport.setScroll(0, 0);

        this.selection = new Selection();
        this.commandManager = new CommandManager();
        this.summaryCalculator = new Summary(this.dataStore);

        this.editor = new Editor(
            this.container, 
            this.dataStore, 
            this.commandManager, 
            () => { this.render(); }
        );

        this.renderer = new GridRenderer(
            this.context,
            this.dataStore,
            this.viewport,
            this.selection
        );
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
        const workerRange = {
            start: { 
                row: Math.min(currentRange.start.row, currentRange.end.row), 
                column: Math.min(currentRange.start.column, currentRange.end.column) 
            },
            end: { 
                row: currentRange.end.row === Number.MAX_SAFE_INTEGER ? Math.min(currentRange.start.row + 50, GridConfig.TOTAL_ROWS - 1) : Math.max(currentRange.start.row, currentRange.end.row), 
                column: currentRange.end.column === Number.MAX_SAFE_INTEGER ? Math.min(currentRange.start.column + 20, GridConfig.TOTAL_COLUMNS - 1) : Math.max(currentRange.start.column, currentRange.end.column) 
            }
        };

        const summaryData = this.summaryCalculator.calculate(workerRange);
        const summaryElement = document.querySelector(".summary-bar");
        if (summaryElement) {
            summaryElement.innerHTML = `
                <span><strong>Count:</strong> ${summaryData.count}</span>
                <span><strong>Sum:</strong> ${summaryData.sum}</span>
                <span><strong>Avg:</strong> ${summaryData.average.toFixed(2)}</span>
                <span><strong>Min:</strong> ${summaryData.min}</span>
                <span><strong>Max:</strong> ${summaryData.max}</span>
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

    private handleMouseDown = (event: MouseEvent): void => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        this.editor.hide();
        this.canvas.focus();

        if (mouseY < GridConfig.HEADER_HEIGHT && mouseX >= GridConfig.HEADER_WIDTH) {
            const hit = this.getColResizeHit(mouseX);
            if (hit) {
                const colModel = this.dataStore.getColumn(hit.index);
                this.resizeState = {
                    type: 'COLUMN',
                    index: hit.index,
                    startSize: colModel ? colModel.width : GridConfig.COLUMN_WIDTH,
                    startMousePos: event.clientX
                };
                return;
            }
        }

        if (mouseX < GridConfig.HEADER_WIDTH && mouseY >= GridConfig.HEADER_HEIGHT) {
            const hit = this.getRowResizeHit(mouseY);
            if (hit) {
                const rowModel = this.dataStore.getRow(hit.index);
                this.resizeState = {
                    type: 'ROW',
                    index: hit.index,
                    startSize: rowModel ? rowModel.height : GridConfig.ROW_HEIGHT,
                    startMousePos: event.clientY
                };
                return;
            }
        }

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) {
            return; 
        }

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
            if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) {
                return; 
            }
            const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + this.viewport.getScrollX();
            const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + this.viewport.getScrollY();

            const currentColumn = this.getColumnAtX(absoluteWorldX);
            const currentRow = this.getRowAtY(absoluteWorldY);

            const startCell = this.selection.getActiveCell();
            this.selection.selectRange(
                { row: startCell.row, column: startCell.column },
                { row: currentRow, column: currentColumn }
            );
            this.render();
            return;
        }

        this.updateMouseCursor(mouseX, mouseY);
    };

    private handleMouseUp = (event: MouseEvent): void => {
        this.isMouseDown = false;

        if (this.resizeState) {
            if (this.resizeState.type === 'COLUMN') {
                const colModel = this.dataStore.getColumn(this.resizeState.index);
                const finalWidth = colModel.width;
                const cmd = new ResizeColumnCommand(colModel, this.resizeState.startSize, finalWidth);
                this.commandManager.execute(cmd);
            } else {
                const rowModel = this.dataStore.getRow(this.resizeState.index);
                const finalHeight = rowModel.height;
                const cmd = new ResizeRowCommand(rowModel, this.resizeState.startSize, finalHeight);
                this.commandManager.execute(cmd);
            }
            this.resizeState = null;
            this.render();
        }
    };

    private updateMouseCursor(mouseX: number, mouseY: number): void {
        if (mouseY < GridConfig.HEADER_HEIGHT && mouseX >= GridConfig.HEADER_WIDTH) {
            if (this.getColResizeHit(mouseX)) {
                this.canvas.style.cursor = "col-resize";
                return;
            }
        }
        if (mouseX < GridConfig.HEADER_WIDTH && mouseY >= GridConfig.HEADER_HEIGHT) {
            if (this.getRowResizeHit(mouseY)) {
                this.canvas.style.cursor = "row-resize";
                return;
            }
        }
        this.canvas.style.cursor = "default";
    }

    private getColResizeHit(mouseX: number): { index: number } | null {
        const visibleArea = this.viewport.getVisibleArea(this.width, this.height);
        const offsetX = this.viewport.getScrollX();
        let accumulatedX = GridConfig.HEADER_WIDTH;

        for (let c = visibleArea.startColumn; c <= visibleArea.endColumn; c++) {
const col = this.dataStore.getColumn(c);const w = col ? col.width : GridConfig.COLUMN_WIDTH;accumulatedX += w;if (Math.abs(mouseX - accumulatedX) <= 4) {return { index: c };}}return null;}private getRowResizeHit(mouseY: number): { index: number } | null {const visibleArea = this.viewport.getVisibleArea(this.width, this.height);const offsetY = this.viewport.getScrollY();let accumulatedY = GridConfig.HEADER_HEIGHT;for (let r = visibleArea.startRow; r <= visibleArea.endRow; r++) {const row = this.dataStore.getRow(r);const h = row ? row.height : GridConfig.ROW_HEIGHT;accumulatedY += h;if (Math.abs(mouseY - accumulatedY) <= 4) {return { index: r };}}return null;}private getColumnAtX(absoluteX: number): number {let accumulatedX = 0;let c = 0;while (c < GridConfig.TOTAL_COLUMNS) {const col = this.dataStore.getColumn(c);const w = col ? col.width : GridConfig.COLUMN_WIDTH;if (absoluteX >= accumulatedX && absoluteX < accumulatedX + w) {return c;}accumulatedX += w;c++;}return GridConfig.TOTAL_COLUMNS - 1;}private getRowAtY(absoluteY: number): number {let accumulatedY = 0;let r = 0;while (r < GridConfig.TOTAL_ROWS) {const row = this.dataStore.getRow(r);const h = row ? row.height : GridConfig.ROW_HEIGHT;if (absoluteY >= accumulatedY && absoluteY < accumulatedY + h) {return r;}accumulatedY += h;r++;}return GridConfig.TOTAL_ROWS - 1;}private handleDoubleClick = (event: MouseEvent): void => {const mouseX = event.offsetX;const mouseY = event.offsetY;if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) return;const active = this.selection.getActiveCell();const offsetX = this.viewport.getScrollX();const offsetY = this.viewport.getScrollY();let screenX = GridConfig.HEADER_WIDTH - offsetX;for (let c = 0; c < active.column; c++) {screenX += this.dataStore.getColumn(c).width;}let screenY = GridConfig.HEADER_HEIGHT - offsetY;for (let r = 0; r < active.row; r++) {screenY += this.dataStore.getRow(r).height;}const activeRow = this.dataStore.getRow(active.row);const activeCol = this.dataStore.getColumn(active.column);this.editor.show(active.row, active.column, screenX, screenY, activeCol.width, activeRow.height);};private handleWheel = (event: WheelEvent): void => {event.preventDefault();let totalWidth = GridConfig.HEADER_WIDTH;for(let c=0; c<GridConfig.TOTAL_COLUMNS; c++) totalWidth += this.dataStore.getColumn(c).width;let totalHeight = GridConfig.HEADER_HEIGHT;for(let r=0; r<GridConfig.TOTAL_ROWS; r++) totalHeight += this.dataStore.getRow(r).height;const maxScrollX = Math.max(0, totalWidth - this.width);const maxScrollY = Math.max(0, totalHeight - this.height);const newScrollX = Math.max(0, Math.min(maxScrollX, this.viewport.getScrollX() + event.deltaX));const newScrollY = Math.max(0, Math.min(maxScrollY, this.viewport.getScrollY() + event.deltaY));this.viewport.setScroll(newScrollX, newScrollY);this.render();};private handleResize = (): void => {this.width = this.container.clientWidth;this.height = this.container.clientHeight;this.canvas.width = this.width;this.canvas.height = this.height;this.render();};private handleKeyDown = (event: KeyboardEvent): void => {if (event.ctrlKey && event.key.toLowerCase() === "z") {event.preventDefault();this.commandManager.undo();this.render();return;}if (event.ctrlKey && event.key.toLowerCase() === "y") {event.preventDefault();this.commandManager.redo();this.render();return;}const active = this.selection.getActiveCell();if (event.key === "ArrowUp") {event.preventDefault();this.selection.setActiveCell(Math.max(0, active.row - 1), active.column);this.render();} else if (event.key === "ArrowDown") {event.preventDefault();this.selection.setActiveCell(Math.min(GridConfig.TOTAL_ROWS - 1, active.row + 1), active.column);this.render();} else if (event.key === "ArrowLeft") {event.preventDefault();this.selection.setActiveCell(active.row, Math.max(0, active.column - 1));this.render();} else if (event.key === "ArrowRight") {event.preventDefault();this.selection.setActiveCell(active.row, Math.min(GridConfig.TOTAL_COLUMNS - 1, active.column + 1));this.render();}};public destroy(): void {this.canvas.removeEventListener("mousedown", this.handleMouseDown);this.canvas.removeEventListener("mousemove", this.handleMouseMove);window.removeEventListener("mouseup", this.handleMouseUp);this.canvas.removeEventListener("dblclick", this.handleDoubleClick);this.canvas.removeEventListener("wheel", this.handleWheel);this.canvas.removeEventListener("keydown", this.handleKeyDown);window.removeEventListener("resize", this.handleResize);if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);}}