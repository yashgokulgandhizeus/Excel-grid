import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { SelectingState } from "./SelectingState";
import { ResizingState } from "./ResizingState";

export class IdleState implements GridState {
    
    public onPointerDown(grid: Grid, event: PointerEvent): void {
        const canvas = event.currentTarget as HTMLCanvasElement;
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        grid.getEditor().hide();
        canvas.focus();

        // 1. Column Header Intercept (Resize vs Header Selection)
        if (mouseY < GridConfig.HEADER_HEIGHT && mouseX >= GridConfig.HEADER_WIDTH) {
            const hit = grid.getColResizeHit(mouseX);
            if (hit) {
                const colModel = grid.getDataStore().getColumn(hit.index);
                canvas.setPointerCapture(event.pointerId);
                grid.changeState(new ResizingState('COLUMN', hit.index, colModel.width, event.clientX, event.pointerId));
                return;
            }
            const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + grid.getViewport().getScrollX();
            const colIndex = grid.getColumnAtX(absoluteWorldX);
            grid.getSelection().selectColumn(colIndex);
            grid.render();
            return; 
        }

        // 2. Row Header Intercept (Resize vs Row Selection)
        if (mouseX < GridConfig.HEADER_WIDTH && mouseY >= GridConfig.HEADER_HEIGHT) {
            const hit = grid.getRowResizeHit(mouseY);
            if (hit) {
                const rowModel = grid.getDataStore().getRow(hit.index);
                canvas.setPointerCapture(event.pointerId);
                grid.changeState(new ResizingState('ROW', hit.index, rowModel.height, event.clientY, event.pointerId));
                return;
            }
            const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + grid.getViewport().getScrollY();
            const rowIndex = grid.getRowAtY(absoluteWorldY);
            grid.getSelection().selectRow(rowIndex);
            grid.render();
            return;
        }

        if (mouseX < GridConfig.HEADER_WIDTH || mouseY < GridConfig.HEADER_HEIGHT) return;

        // 3. Central Grid Selection Hook Transition
        const absoluteWorldX = (mouseX - GridConfig.HEADER_WIDTH) + grid.getViewport().getScrollX();
        const absoluteWorldY = (mouseY - GridConfig.HEADER_HEIGHT) + grid.getViewport().getScrollY();

        const targetColumn = grid.getColumnAtX(absoluteWorldX);
        const targetRow = grid.getRowAtY(absoluteWorldY);

        grid.getSelection().setActiveCell(targetRow, targetColumn);
        canvas.setPointerCapture(event.pointerId);
        grid.changeState(new SelectingState(targetRow, targetColumn, event.pointerId));
        grid.render();
    }

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        grid.updateMouseCursor(event.offsetX, event.offsetY);
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {
        // No operation in idle state
    }
}
