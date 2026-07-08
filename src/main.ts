import "./style.css";
import { Grid } from "./core/Grid";
import { GridRenderer } from "./renderer/GridRenderer";
import {
    DEFAULT_COLUMNS,
    DEFAULT_ROWS
} from "./utils/Constants";

const canvas = document.getElementById(
    "gridCanvas"
) as HTMLCanvasElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d")!;

const grid = new Grid(
    DEFAULT_ROWS,
    DEFAULT_COLUMNS
);

const renderer = new GridRenderer(
    ctx,
    grid
);

renderer.render();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.render();
});
