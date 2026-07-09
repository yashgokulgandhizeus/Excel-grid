import { Grid } from "./grid/Grid";

export class App {

    private grid: Grid;

    constructor() {

        const app = document.getElementById("app");

        if (!app) {
            throw new Error("App container not found");
        }

        this.grid = new Grid(app);

        this.grid.init();
    }
}
