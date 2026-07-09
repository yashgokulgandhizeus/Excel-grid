import type{ ICommand } from "./ICommand";
import { Column } from "../model/Column";

export class ResizeColumnCommand implements ICommand {

        private column: Column;
        private oldWidth: number;
        private newWidth: number;

    constructor(
        column: Column,
        oldWidth: number,
        newWidth: number
    ) {
        this.column=column;
        this.newWidth=newWidth;
        this.oldWidth=oldWidth;
    }

    execute(): void {

        this.column.setWidth(this.newWidth);

    }

    undo(): void {

        this.column.setWidth(this.oldWidth);

    }

}
