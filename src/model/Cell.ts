export class Cell {
    public row: number;
    public column: number;
    public value: string;

    constructor(
        row: number,
        column: number,
        value: string = ""
    ) {
        this.row = row;
        this.column = column;
        this.value = value;
    }

    setValue(value: string): void {
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }
}
