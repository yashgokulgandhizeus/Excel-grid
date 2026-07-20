import { Grid } from "../grid/Grid";

export interface GridState {
    onPointerDown(grid: Grid, event: PointerEvent): void;
    onPointerMove(grid: Grid, event: PointerEvent): void;
    onPointerUp(grid: Grid, event: PointerEvent): void;
}
