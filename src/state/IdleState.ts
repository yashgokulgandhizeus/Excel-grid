import type{ GridState } from "./GridState";
import type{ InteractionHandler } from "./InteractionHandler";
import type{ Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { GeometryHelpers } from "./GeometryHelpers";
import { RowResizeHandler } from "./RowResizeHandler";
import { ColumnResizeHandler } from "./ColumnResizeHandler";
import { RowSelectionHandler } from "./RowSelectionHandler";
import { ColumnSelectionHandler } from "./ColumnSelectionHandler";
import { CellSelectionHandler } from "./CellSelectionHandler";

export class IdleState implements GridState {
    private handlers: InteractionHandler[] = [
        new RowResizeHandler(),
        new ColumnResizeHandler(),
        new RowSelectionHandler(),
        new ColumnSelectionHandler(),
        new CellSelectionHandler()
    ];

    public onPointerDown(grid: Grid, event: PointerEvent): void {
        grid.getEditor().hide();
        grid.getCanvas().focus();

        for (const handler of this.handlers) {
            if (handler.isMatch(grid, event)) {
                handler.execute(grid, event);
                return;
            }
        }
    }

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        const x = event.offsetX;
        const y = event.offsetY;
        const canvas = grid.getCanvas();

        if (y < GridConfig.HEADER_HEIGHT && x >= GridConfig.HEADER_WIDTH && GeometryHelpers.getColResizeIndex(grid, x) !== null) {
            canvas.style.cursor = "col-resize";
        } else if (x < GridConfig.HEADER_WIDTH && y >= GridConfig.HEADER_HEIGHT && GeometryHelpers.getRowResizeIndex(grid, y) !== null) {
            canvas.style.cursor = "row-resize";
        } else {
            canvas.style.cursor = "default";
        }
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {}
}
