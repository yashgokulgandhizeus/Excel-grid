import type{ ICommand } from "./ICommand";

export class CommandManager {

    private undoStack: ICommand[] = [];

    private redoStack: ICommand[] = [];

    public execute(command: ICommand): void {

        command.execute();

        this.undoStack.push(command);

        this.redoStack = [];

    }

    public undo(): void {

        if (this.undoStack.length === 0) {
            return;
        }

        const command = this.undoStack.pop()!;

        command.undo();

        this.redoStack.push(command);

    }

    public redo(): void {

        if (this.redoStack.length === 0) {
            return;
        }

        const command = this.redoStack.pop()!;

        command.execute();

        this.undoStack.push(command);

    }

}