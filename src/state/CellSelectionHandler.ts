import type{ InteractionHandler } from "./InteractionHandler";
import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { GeometryHelpers } from "./GeometryHelpers";
import { IdleState } from "./IdleState";

export class CellSelectionHandler implements InteractionHandler, GridState {
    private startRow = 0;
    private startCol = 0;
    private pointerId = -1;

    public isMatch(grid: Grid, event: PointerEvent): boolean {
        return event.offsetX >= GridConfig.HEADER_WIDTH && event.offsetY >= GridConfig.HEADER_HEIGHT;
    }

    public execute(grid: Grid, event: PointerEvent): void {
        const absoluteWorldX = (event.offsetX - GridConfig.HEADER_WIDTH) + grid.getViewport().getScrollX();
        const absoluteWorldY = (event.offsetY - GridConfig.HEADER_HEIGHT) + grid.getViewport().getScrollY();

        this.startCol = GeometryHelpers.getColumnAtX(grid, absoluteWorldX);
        this.startRow = GeometryHelpers.getRowAtY(grid, absoluteWorldY);
        this.pointerId = event.pointerId;

        grid.getSelection().setActiveCell(this.startRow, this.startCol);
        grid.getCanvas().setPointerCapture(event.pointerId);
        grid.changeState(this);
        grid.render();
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        if (event.offsetX < GridConfig.HEADER_WIDTH || event.offsetY < GridConfig.HEADER_HEIGHT) return;

        const absoluteWorldX = (event.offsetX - GridConfig.HEADER_WIDTH) + grid.getViewport().getScrollX();
        const absoluteWorldY = (event.offsetY - GridConfig.HEADER_HEIGHT) + grid.getViewport().getScrollY();

        grid.getSelection().selectRange(
            { row: this.startRow, column: this.startCol },
            { row: GeometryHelpers.getRowAtY(grid, absoluteWorldY), column: GeometryHelpers.getColumnAtX(grid, absoluteWorldX) }
        );
        grid.render();
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {
        if (event.pointerId === this.pointerId) {
            grid.getCanvas().releasePointerCapture(this.pointerId);
            grid.changeState(new IdleState());
        }
    }
}
