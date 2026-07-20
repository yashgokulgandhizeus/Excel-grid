import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { ResizeColumnCommand } from "../commands/ResizeColumnCommand";
import { ResizeRowCommand } from "../commands/ResizeRowCommand";
import { IdleState } from "./IdleState";

export class ResizingState implements GridState {
    private type: 'COLUMN' | 'ROW';
    private index: number;
    private startSize: number;
    private startMousePos: number;
    private pointerId: number;

    constructor(type: 'COLUMN' | 'ROW', index: number, startSize: number, startMousePos: number, pointerId: number) {
        this.type = type;
        this.index = index;
        this.startSize = startSize;
        this.startMousePos = startMousePos;
        this.pointerId = pointerId;
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}

    public onPointerMove(grid: Grid, event: PointerEvent): void {
        if (this.type === 'COLUMN') {
            const deltaX = event.clientX - this.startMousePos;
            const newWidth = Math.max(GridConfig.MIN_COLUMN_WIDTH, this.startSize + deltaX);
            grid.getDataStore().getColumn(this.index).setWidth(newWidth);
        } else {
            const deltaY = event.clientY - this.startMousePos;
            const newHeight = Math.max(GridConfig.MIN_ROW_HEIGHT, this.startSize + deltaY);
            grid.getDataStore().getRow(this.index).setHeight(newHeight);
        }
        grid.render();
    }

    public onPointerUp(grid: Grid, event: PointerEvent): void {
        if (event.pointerId === this.pointerId) {
            const canvas = event.currentTarget as HTMLCanvasElement;
            canvas.releasePointerCapture(this.pointerId);

            const currentSize = this.type === 'COLUMN'
                ? grid.getDataStore().getColumn(this.index).width
                : grid.getDataStore().getRow(this.index).height;

            if (currentSize !== this.startSize) {
                const command = this.type === 'COLUMN'
                    ? new ResizeColumnCommand(grid.getDataStore().getColumn(this.index), this.startSize, currentSize)
                    : new ResizeRowCommand(grid.getDataStore().getRow(this.index), this.startSize, currentSize);
                grid.getCommandManager().execute(command);
            }

            grid.changeState(new IdleState());
            grid.render();
        }
    }
}
