import { GridConfig } from "../config/GridConfig";

export class Row {
    public index: number;
    public height: number;

    constructor(
        index: number,
        height: number = GridConfig.ROW_HEIGHT
    ) {
        this.index = index;
        this.height = height;
    }

    setHeight(height: number): void {
        this.height = Math.max(
            GridConfig.MIN_ROW_HEIGHT,
            height
        );
    }
}
