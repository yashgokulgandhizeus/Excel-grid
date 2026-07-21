import type{ InteractionHandler } from "./InteractionHandler";
import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { GeometryHelpers } from "./GeometryHelpers";
import { IdleState } from "./IdleState";

export class RowSelectionHandler implements InteractionHandler, GridState {
    
    public isMatch(grid: Grid, event: PointerEvent): boolean {
        // Condition: Clicked within left row bar bounds but NOT on a split seam line
        return event.offsetX < GridConfig.HEADER_WIDTH && 
               event.offsetY >= GridConfig.HEADER_HEIGHT && 
               GeometryHelpers.getRowResizeIndex(grid, event.offsetY) === null;
    }

    public execute(grid: Grid, event: PointerEvent): void {
        const absoluteWorldY = (event.offsetY - GridConfig.HEADER_HEIGHT) + grid.getViewport().getScrollY();
        const rowIndex = GeometryHelpers.getRowAtY(grid, absoluteWorldY);
        
        grid.getSelection().selectRow(rowIndex);
        grid.changeState(new IdleState()); // Row select actions happen instantly. Safely drop right back to idle.
        grid.render();
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}
    public onPointerMove(grid: Grid, event: PointerEvent): void {}
    public onPointerUp(grid: Grid, event: PointerEvent): void {}
}
