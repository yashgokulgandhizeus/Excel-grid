import { GridConfig } from "../config/GridConfig";
import { GridDataStore } from "../data/GridDataStore";

export class Editor {

    private input: HTMLInputElement;

    private row = 0;
    private column = 0;
    private container: HTMLElement;
    private dataStore: GridDataStore;
    private onSave: () => void;

    constructor(
        container: HTMLElement,
        dataStore: GridDataStore,
        onSave: () => void
    ) {
        
        this.container=container;
        this.dataStore=dataStore;
        this.onSave=onSave;
        
        this.input = document.createElement("input");

        this.input.className = "cell-input";

        this.container.appendChild(this.input);

        this.registerEvents();

    }

    private registerEvents(): void {

        this.input.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                this.save();
            }

            if (event.key === "Escape") {
                this.hide();
            }

        });

        this.input.addEventListener("blur", () => {

            this.save();

        });

    }

    public show(
        row: number,
        column: number,
        x: number,
        y: number,
        width: number = GridConfig.COLUMN_WIDTH,
        height: number = GridConfig.ROW_HEIGHT
    ): void {

        this.row = row;
        this.column = column;

        this.input.style.display = "block";
        this.input.style.left = `${x}px`;
        this.input.style.top = `${y}px`;
        this.input.style.width = `${width - 4}px`;
        this.input.style.height = `${height - 4}px`;

        this.input.value =
            this.dataStore.getCellValue(row, column);

        this.input.focus();
        this.input.select();

    }

    public hide(): void {

        this.input.style.display = "none";

    }

    private save(): void {

        this.dataStore.setCell(
            this.row,
            this.column,
            this.input.value
        );

        this.hide();

        this.onSave();

    }

}