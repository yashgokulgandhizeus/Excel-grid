export class Column {
    public index: number;
    public width: number;

    constructor(index: number, width: number = 100) {
        this.index = index;
        this.width = width;
    }
}
