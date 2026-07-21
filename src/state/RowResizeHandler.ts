import type{ InteractionHandler } from "./InteractionHandler";
import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { GeometryHelpers } from "./GeometryHelpers";
import { IdleState } from "./IdleState";
import { ResizeRowCommand } from "../commands/ResizeRowCommand";

export class RowResizeHandler implements InteractionHandler, GridState {
    private index = -1;
    private startSize = 0;
    private startMousePos = 0;
    private pointerId = -1;

    public isMatch(grid: Grid, event: PointerEvent): boolean {
        // Condition: Clicked on the left side row header zone AND hits a horizontal seam line
        return event.offsetX < GridConfig.HEADER_WIDTH && 
               event.offsetY >= GridConfig.HEADER_HEIGHT && 
               GeometryHelpers.getRowResizeIndex(grid, event.offsetY) !== null;
    }

    public execute(grid: Grid, event: PointerEvent): void {
        const targetIndex = GeometryHelpers.getRowResizeIndex(grid, event.offsetY)!;
        const rowModel = grid.getDataStore().getRow(targetIndex);

        this.index = targetIndex;
        this.startSize = rowModel.height;
        this.startMousePos = event.clientY;
        this.pointerId = event.pointerId;

        grid.getCanvas().setPointerCapture(event.pointerId);
        grid.changeState(this); // Transition into itself as the active modal state loop
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        const deltaY = event.clientY - this.startMousePos;
        grid.getDataStore().getRow(this.index).setHeight(Math.max(GridConfig.MIN_ROW_HEIGHT, this.startSize + deltaY));
        grid.render();
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {
        if (event.pointerId === this.pointerId) {
            grid.getCanvas().releasePointerCapture(this.pointerId);
            
            const currentSize = grid.getDataStore().getRow(this.index).height;
            if (currentSize !== this.startSize) {
                grid.getCommandManager().execute(new ResizeRowCommand(grid.getDataStore().getRow(this.index), this.startSize, currentSize));
            }
            grid.changeState(new IdleState());
            grid.render();
        }
    }
}
