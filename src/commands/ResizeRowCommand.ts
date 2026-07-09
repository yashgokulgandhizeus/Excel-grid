import type{ ICommand } from "./ICommand";
import { Row } from "../model/Row";

export class ResizeRowCommand implements ICommand {

        private row: Row;
        private oldHeight: number;
        private newHeight: number;

    constructor(
        row: Row,
        oldHeight: number,
        newHeight: number
    ) {
        this.row=row;
        this.oldHeight=oldHeight;
        this.newHeight=newHeight;
    }

    execute(): void {

        this.row.setHeight(this.newHeight);

    }

    undo(): void {

        this.row.setHeight(this.oldHeight);

    }

}