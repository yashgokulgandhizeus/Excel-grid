import type{ InteractionHandler } from "./InteractionHandler";
import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { GeometryHelpers } from "./GeometryHelpers";
import { IdleState } from "./IdleState";
import { ResizeColumnCommand } from "../commands/ResizeColumnCommand";

export class ColumnResizeHandler implements InteractionHandler, GridState {
    private index = -1;
    private startSize = 0;
    private startMousePos = 0;
    private pointerId = -1;

    public isMatch(grid: Grid, event: PointerEvent): boolean {
        // Handlers run their own independent hit math now!
        return event.offsetY < GridConfig.HEADER_HEIGHT && 
               event.offsetX >= GridConfig.HEADER_WIDTH && 
               GeometryHelpers.getColResizeIndex(grid, event.offsetX) !== null;
    }

    public execute(grid: Grid, event: PointerEvent): void {
        const targetIndex = GeometryHelpers.getColResizeIndex(grid, event.offsetX)!;
        const colModel = grid.getDataStore().getColumn(targetIndex);

        this.index = targetIndex;
        this.startSize = colModel.width;
        this.startMousePos = event.clientX;
        this.pointerId = event.pointerId;

        grid.getCanvas().setPointerCapture(event.pointerId);
        grid.changeState(this);
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        const deltaX = event.clientX - this.startMousePos;
        grid.getDataStore().getColumn(this.index).setWidth(Math.max(GridConfig.MIN_COLUMN_WIDTH, this.startSize + deltaX));
        grid.render();
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {
        if (event.pointerId === this.pointerId) {
            grid.getCanvas().releasePointerCapture(this.pointerId);
            const currentSize = grid.getDataStore().getColumn(this.index).width;
            if (currentSize !== this.startSize) {
                grid.getCommandManager().execute(new ResizeColumnCommand(grid.getDataStore().getColumn(this.index), this.startSize, currentSize));
            }
            grid.changeState(new IdleState());
            grid.render();
        }
    }
}
