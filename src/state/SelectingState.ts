import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { IdleState } from "./IdleState";

export class SelectingState implements GridState {
    private startRow: number;
    private startCol: number;
    private pointerId: number;

    constructor(startRow: number, startCol: number, pointerId: number) {
        this.startRow = startRow;
        this.startCol = startCol;
        this.pointerId = pointerId;
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) return;

        const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + grid.getViewport().getScrollX();
        const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + grid.getViewport().getScrollY();

        const currentColumn = grid.getColumnAtX(absoluteWorldX);
        const currentRow = grid.getRowAtY(absoluteWorldY);

        grid.getSelection().selectRange(
            { row: this.startRow, column: this.startCol },
            { row: currentRow, column: currentColumn }
        );
        grid.render();
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {
        if (event.pointerId === this.pointerId) {
            const canvas = event.currentTarget as HTMLCanvasElement;
            canvas.releasePointerCapture(this.pointerId);
            grid.changeState(new IdleState());
        }
    }
}
