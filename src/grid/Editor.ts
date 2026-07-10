import { GridConfig } from "../config/GridConfig";
import { GridDataStore } from "../data/GridDataStore";
import { CommandManager } from "../commands/CommandManager"; 
import { EditCommand } from "../commands/EditCommand";       

export class Editor {
    private input: HTMLInputElement;
    private row = 0;
    private column = 0;
    private container: HTMLElement;
    private dataStore: GridDataStore;
    private commandManager: CommandManager;
    private onSave: () => void;
    private isSaving = false;

    constructor(
        container: HTMLElement,
        dataStore: GridDataStore,
        commandManager: CommandManager, 
        onSave: () => void
    ) {
        this.container = container;
        this.dataStore = dataStore;
        this.commandManager = commandManager; 
        this.onSave = onSave;
        
        this.input = document.createElement("input");
        this.input.className = "cell-input";
        this.container.appendChild(this.input);

        this.registerEvents();
    }

    private registerEvents(): void {
        this.input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.save();
            }

            if (event.key === "Escape") {
                event.preventDefault();
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
        this.isSaving = false;

        this.input.style.display = "block";
        this.input.style.pointerEvents = "auto";
        this.input.style.left = `${x}px`;
        this.input.style.top = `${y}px`;
        this.input.style.width = `${width - 4}px`;
        this.input.style.height = `${height - 4}px`;

        this.input.value = this.dataStore.getCellValue(row, column);

        this.input.focus();
        this.input.select();
    }

    public hide(): void {
        this.input.style.display = "none";
        this.input.style.pointerEvents = "none"; 
    }

    private save(): void {
        if (this.isSaving) {
            return;
        }
        
        const newValue = this.input.value;
        const oldValue = this.dataStore.getCellValue(this.row, this.column);

        if (newValue === oldValue) {
            this.hide();
            return;
        }

        this.isSaving = true;

        const editCommand = new EditCommand(
            this.dataStore,
            this.row,
            this.column,
            oldValue,
            newValue
        );

        this.commandManager.execute(editCommand);

        this.hide();
        this.onSave();
    }
}
