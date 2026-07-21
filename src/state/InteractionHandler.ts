import { Grid } from "../grid/Grid";

export interface InteractionHandler {

    isMatch(grid: Grid, event: PointerEvent): boolean;

    execute(grid: Grid, event: PointerEvent): void;
}
