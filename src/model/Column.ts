import { GridConfig } from "../config/GridConfig";

export class Column {
    public index: number;
    public width: number;

    constructor(index: number, width?: number) {
        this.index = index;
        // Fix: Fallback to default config if width is undefined or zero
        this.width = width ?? GridConfig.COLUMN_WIDTH; 
    }

    setWidth(width: number): void {
        this.width = Math.max(
            GridConfig.MIN_COLUMN_WIDTH,
            width
        );
    }

    getName(): string {
        let result = "";
        let value = this.index;

        while (value >= 0) {
            result = String.fromCharCode(65 + (value % 26)) + result;
            value = Math.floor(value / 26) - 1;
        }

        return result;
    }
}
