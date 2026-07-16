Excel Grid

An Excel-like grid application built using TypeScript, HTML, CSS, and HTML Canvas. The project focuses on building a spreadsheet interface while following Object-Oriented Programming principles, clean architecture, and modular code organization.

Tech Stack

- TypeScript
- HTML5 Canvas
- CSS3
- Vite

---

Project Structure

src<br>
│<br>
├── core<br>
│   ├── Grid.ts<br>
│   ├── Row.ts<br>
│   ├── Column.ts<br>
│   └── Cell.ts<br>
│<br>
├── renderer<br>
│   └── GridRenderer.ts<br>
│<br>
├── utils<br>
│   └── Constants.ts<br>
│<br>
├── style.css<br>
│<br>
└── main.ts<br>

---

Project Architecture

main.ts<br>
   │<br>
   ▼<br>
Grid<br>
   │<br>
   ├── Rows<br>
   └── Columns<br>
        │<br>
        ▼<br>
GridRenderer<br>
        │<br>
        ▼<br>
HTML Canvas<br>

---

File Overview

main.ts

The entry point of the application.

Responsibilities:

- Creates the canvas.
- Creates the Grid object.
- Creates the GridRenderer.
- Starts rendering the spreadsheet.

---

Grid.ts

Represents the spreadsheet model.

Responsibilities:

- Creates all rows.
- Creates all columns.
- Owns the spreadsheet structure.

The Grid acts as the central object of the application. Any class that needs spreadsheet information interacts with the Grid.

---

Row.ts

Represents a single spreadsheet row.

Current properties:

- Row Index
- Row Height

Each row stores its own height, making row resizing simple to implement.

---

Column.ts

Represents a single spreadsheet column.

Current properties:

- Column Index
- Column Width

Each column manages its own width, which will later be used for column resizing.

---

Cell.ts

Represents an individual spreadsheet cell.

Current properties:

- Row Index
- Column Index
- Cell Value

This class is responsible for storing information related to a single cell.

---

GridRenderer.ts

Responsible for rendering the spreadsheet on the HTML Canvas.

Current responsibilities:

- Clear the canvas.
- Draw column headers.
- Draw row headers.
- Draw grid lines.

The renderer only displays data. It does not store spreadsheet data.

---

Constants.ts

Stores all reusable configuration values used across the project.

Examples:

- Cell Width
- Cell Height
- Header Width
- Header Height
- Default Row Count
- Default Column Count

Keeping these values in one place makes the application easier to maintain.

---

Current Workflow

When the application starts, the following sequence occurs:

Application Starts
        │
        ▼
main.ts
        │
        ▼
Create Grid
        │
        ├── Create Rows
        └── Create Columns
        │
        ▼
Create GridRenderer
        │
        ▼
Render Spreadsheet
        │
        ├── Clear Canvas
        ├── Draw Headers
        └── Draw Grid

---

Design Principles

- Object-Oriented Programming (OOP)
- Single Responsibility Principle
- Separation of Concerns
- Modular Project Structure
- Reusable Components

---

Current Features

- HTML Canvas setup
- Spreadsheet grid rendering
- Row headers
- Column headers
- Grid lines
- Modular TypeScript architecture
- Separate Grid, Row, Column, Cell and Renderer classes

---

Running the Project

Install dependencies:

npm install

Start the development server:

npm run dev

Build the project:

npm run build

Preview the production build:

npm run preview
