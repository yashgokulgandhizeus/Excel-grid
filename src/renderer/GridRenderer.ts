import { Grid } from "../core/Grid";
import {
    CELL_HEIGHT,
    CELL_WIDTH,
    HEADER_HEIGHT,
    HEADER_WIDTH
} from "../utils/Constants";

export class GridRenderer {
    private ctx: CanvasRenderingContext2D;
    private grid: Grid;

    constructor(ctx: CanvasRenderingContext2D, grid: Grid) {
        this.ctx = ctx;
        this.grid = grid;
    }

    render() {
        this.clear();
        this.drawHeaders();
        this.drawGridLines();
    }

    private clear() {
        this.ctx.clearRect(
            0,
            0,
            this.ctx.canvas.width,
            this.ctx.canvas.height
        );
    }

    private drawHeaders() {
        this.ctx.font = "14px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        for (let i = 0; i < this.grid.columnCount; i++) {
            const x = HEADER_WIDTH + i * CELL_WIDTH;
            this.ctx.strokeRect(
                x,
                0,
                CELL_WIDTH,
                HEADER_HEIGHT
            );
            this.ctx.fillText(
                this.getColumnName(i),
                x + CELL_WIDTH / 2,
                HEADER_HEIGHT / 2
            );
        }

        for (let i = 0; i < this.grid.rowCount; i++) {
            const y = HEADER_HEIGHT + i * CELL_HEIGHT;
            this.ctx.strokeRect(
                0,
                y,
                HEADER_WIDTH,
                CELL_HEIGHT
            );
            this.ctx.fillText(
                (i + 1).toString(),
                HEADER_WIDTH / 2,
                y + CELL_HEIGHT / 2
            );
        }
    }

    private drawGridLines() {
        const visibleRows = 20;
        const visibleColumns = 10;

        for (let r = 0; r < visibleRows; r++) {
            for (let c = 0; c < visibleColumns; c++) {
                this.ctx.strokeRect(
                    HEADER_WIDTH + c * CELL_WIDTH,
                    HEADER_HEIGHT + r * CELL_HEIGHT,
                    CELL_WIDTH,
                    CELL_HEIGHT
                );
            }
        }
    }

    private getColumnName(index: number): string {
        return String.fromCharCode(65 + index);
    }
}
