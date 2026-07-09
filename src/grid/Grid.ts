// src/grid/Grid.ts

import { GridRenderer } from "./GridRenderer";
import { GridDataStore } from "../data/GridDataStore";
import { Viewport } from "./ViewPort";
import { Selection } from "./Selection";
import { Editor } from "./Editor";
import { Summary } from "./Summary";
import { CommandManager } from "../commands/CommandManager";
import { GridConfig } from "../config/GridConfig";

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
    private isMouseDown = false; // Flag safeguard to track drag interaction states

    constructor(container: HTMLElement) {
        this.container = container;

        this.canvas = document.createElement("canvas");
        this.canvas.tabIndex = 0; // Allows the canvas to intercept keyboard events directly
        this.canvas.style.outline = "none"; // Disables default browser outlines
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
        window.addEventListener("mouseup", this.handleMouseUp); // Listen globally to catch mouse up outside canvas area
        this.canvas.addEventListener("dblclick", this.handleDoubleClick);
        this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
        this.canvas.addEventListener("keydown", this.handleKeyDown); // Canvas-level keyboard interception
        window.addEventListener("resize", this.handleResize);
    }

    private handleMouseDown = (event: MouseEvent): void => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        this.editor.hide();
        this.canvas.focus(); // Pulls operational system focus directly onto our spreadsheet surface

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) {
            return; 
        }

        this.isMouseDown = true; // Turn dragging flag ON

        const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + this.viewport.getScrollX();
        const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + this.viewport.getScrollY();

        const targetColumn = Math.floor(absoluteWorldX / GridConfig.COLUMN_WIDTH);
        const targetRow = Math.floor(absoluteWorldY / GridConfig.ROW_HEIGHT);

        const finalRow = Math.max(0, Math.min(targetRow, GridConfig.TOTAL_ROWS - 1));
        const finalCol = Math.max(0, Math.min(targetColumn, GridConfig.TOTAL_COLUMNS - 1));

        // Initialized selection anchor point origin location coordinates
        this.selection.setActiveCell(finalRow, finalCol);
        this.render();
    };

    private handleMouseMove = (event: MouseEvent): void => {
        if (!this.isMouseDown) {
            return;
        }

        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) {
            return; 
        }

        const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + this.viewport.getScrollX();
        const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + this.viewport.getScrollY();

        const currentColumn = Math.floor(absoluteWorldX / GridConfig.COLUMN_WIDTH);
        const currentRow = Math.floor(absoluteWorldY / GridConfig.ROW_HEIGHT);

        const finalRow = Math.max(0, Math.min(currentRow, GridConfig.TOTAL_ROWS - 1));
        const finalCol = Math.max(0, Math.min(currentColumn, GridConfig.TOTAL_COLUMNS - 1));

        const startCell = this.selection.getActiveCell();

        // Expands selection frame layout mapping boundaries dynamically
        this.selection.selectRange(
            { row: startCell.row, column: startCell.column },
            { row: finalRow, column: finalCol }
        );

        this.render();
    };

    private handleMouseUp = (): void => {
        this.isMouseDown = false; // Turn dragging flag OFF
    };

    private handleDoubleClick = (event: MouseEvent): void => {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) {
            return;
        }

        const active = this.selection.getActiveCell();

        const screenX = GridConfig.HEADER_WIDTH + (active.column * GridConfig.COLUMN_WIDTH) - this.viewport.getScrollX();
        const screenY = GridConfig.HEADER_HEIGHT + (active.row * GridConfig.ROW_HEIGHT) - this.viewport.getScrollY();

        this.editor.show(active.row, active.column, screenX, screenY, GridConfig.COLUMN_WIDTH, GridConfig.ROW_HEIGHT);
    };

    private handleWheel = (event: WheelEvent): void => {
        event.preventDefault();
        
        const maxScrollX = (GridConfig.TOTAL_COLUMNS * GridConfig.COLUMN_WIDTH) - this.width + GridConfig.HEADER_WIDTH;
        const maxScrollY = (GridConfig.TOTAL_ROWS * GridConfig.ROW_HEIGHT) - this.height + GridConfig.HEADER_HEIGHT;

        const newScrollX = Math.max(0, Math.min(maxScrollX, this.viewport.getScrollX() + event.deltaX));
        const newScrollY = Math.max(0, Math.min(maxScrollY, this.viewport.getScrollY() + event.deltaY));

        this.viewport.setScroll(newScrollX, newScrollY);
        this.render();
    };

    private handleResize = (): void => {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.render();
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (event.ctrlKey && event.key.toLowerCase() === "z") {
            event.preventDefault();
            this.commandManager.undo();
            this.render();
            return;
        }

        if (event.ctrlKey && event.key.toLowerCase() === "y") {
            event.preventDefault();
            this.commandManager.redo();
            this.render();
            return;
        }

        const active = this.selection.getActiveCell();

        if (event.key === "ArrowUp") {
            event.preventDefault();
            this.selection.setActiveCell(Math.max(0, active.row - 1), active.column);
            this.render();
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            this.selection.setActiveCell(Math.min(GridConfig.TOTAL_ROWS - 1, active.row + 1), active.column);
            this.render();
            return;
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            this.selection.setActiveCell(active.row, Math.max(0, active.column - 1));
            this.render();
            return;
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
this.selection.setActiveCell(active.row, Math.min(GridConfig.TOTAL_COLUMNS - 1, active.column + 1));this.render();return;}};public destroy(): void {this.canvas.removeEventListener("mousedown", this.handleMouseDown);this.canvas.removeEventListener("mousemove", this.handleMouseMove);window.removeEventListener("mouseup", this.handleMouseUp);this.canvas.removeEventListener("dblclick", this.handleDoubleClick);this.canvas.removeEventListener("wheel", this.handleWheel);this.canvas.removeEventListener("keydown", this.handleKeyDown);window.removeEventListener("resize", this.handleResize);if (this.canvas.parentNode) {this.canvas.parentNode.removeChild(this.canvas);}}}