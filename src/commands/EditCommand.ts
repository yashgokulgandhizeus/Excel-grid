import type{ ICommand } from "./ICommand";
import { GridDataStore } from "../data/GridDataStore";

export class EditCommand implements ICommand {

    private dataStore: GridDataStore;
    private row: number;
    private column: number;
    private oldValue: string;
    private newValue: string;

    constructor(
        dataStore: GridDataStore,
        row: number,
        column: number,
        oldValue: string,
        newValue: string
    ) {
        this.dataStore=dataStore;
        this.row=row;
        this.column=column;
        this.oldValue=oldValue;
        this.newValue=newValue;
    }

    execute(): void {

        this.dataStore.setCell(
            this.row,
            this.column,
            this.newValue
        );

    }

    undo(): void {

        this.dataStore.setCell(
            this.row,
            this.column,
            this.oldValue
        );

    }

}