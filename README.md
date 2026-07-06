# Kanban Board05

A high-performance, F1-themed Neo-Brutalist Kanban board planner. It features dual high-contrast racing themes (McLaren Dark and Mercedes Light), local storage data persistence, index-based vertical card sorting via drag-and-drop, priority sorting, search capabilities, and board reset functions.

## Key Features

- **F1 Dual-Theme Support**: Easily toggle between dark McLaren theme (Papaya Orange & Carbon Black) and light Mercedes theme (Silverish Gray & Petronas Teal). Theme states persist automatically on reload.
- **Dynamic HTML5 Drag and Drop**: Move cards smoothly between columns or sort their vertical hierarchies inside a column by dragging.
- **Advanced Sorting & Filtering**: Sort cards by custom drag positions, priority weights (High > Medium > Low), or due date. Search titles/descriptions on the fly.
- **Zero Dependencies**: Built entirely with native vanilla HTML5, CSS3 variables, and clean JavaScript.
- **Reset Board**: Instantly wipe custom columns/cards and restore the default board layout.
- **Local Storage Synchronization**: Save data locally so your board persists after a page refresh.

---

## Tech Stack

- **Markup**: Semantic HTML5
- **Styling**: Vanilla CSS3 Custom Properties (CSS variables)
- **Scripting**: Vanilla ECMAScript 6+
- **Typography**: Google Fonts (Space Grotesk & Grenze Gotisch)
- **Icons**: Hand-crafted Inline SVG Vector Icons
- **Persistence**: Web Storage API (`localStorage`)
- **Hosting / Deployable**: Static Single Page Application (SPA)

---

## Prerequisites

To run this application locally, you only need:
- Any modern web browser (Google Chrome, Firefox, Safari, Microsoft Edge) supporting HTML5 Drag and Drop, ES6, and `localStorage`.
- Optionally: Node.js (v24 or similar) or Python to run a local web server (highly recommended for file url security policies).

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/ronaksarda/board-05-cosc.git
cd board-05-cosc
```

### 2. Run Locally

#### Option A: Open directly in Browser
Double click `index.html` or open it with your web browser:
```bash
# On Windows
start index.html

# On macOS
open index.html
```

#### Option B: Run a local static server (Recommended)
Running a local server avoids browser-specific cross-origin resource limitations and file URL locks:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js static server:**
```bash
npx serve .
```

Now open [http://localhost:8000](http://localhost:8000) or [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Architecture

### Directory Structure
```
├── index.html     # Semantic page structure & modals markup
├── style.css      # Neo-Brutalist themes, variables, and responsive layout
├── script.js     # State manager, DnD calculations, and view controller
└── README.md      # Project documentation
```

### Data Flow Diagram
```
User Action (Create/Drag/Sort) ──► JavaScript Event Handler
                                          │
                                          ▼
                             Update State (state.cards / state.columns)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
      Serialize to LocalStorage                        Redraw DOM (renderBoard)
  `kanban_cards` / `kanban_columns`            Clears canvas, appends column & card nodes
```

### State Structure
```javascript
let state = {
  columns: [
    { id: "todo", title: "To Do", color: "#6366f1" },
    ...
  ],
  cards: [
    {
      id: "card-12345",
      title: "Task Title",
      description: "Detailed description text",
      columnId: "todo",
      priority: "high", // low, medium, or high
      dueDate: "2026-07-06",
      order: 0 // Index sequence within the column
    }
  ]
};
```

---

## Theme Variables Reference

Themes are controlled by CSS custom properties defined in `style.css`. Dark Mode is configured under `:root` (McLaren), and Light Mode is activated by the `.light-theme` class overrides (Mercedes):

| Property | McLaren (Dark Mode) | Mercedes (Light Mode) | Usage |
|---|---|---|---|
| `--bg-app` | `#0a0b0e` (Jet Dark) | `#eef1f6` (Light Silver) | Main page background |
| `--bg-app-dot` | `#1d1f27` | `#cad0e0` | Dotted grid pattern |
| `--bg-column` | `#12131a` | `#ffffff` | Columns panel background |
| `--bg-card` | `#1c1d24` (Carbon) | `#ffffff` | Cards background |
| `--color-mclaren` | `#ff8700` (Papaya) | `#00b5ac` (Teal) | Theme primary brand color |
| `--text-main` | `#f5f6fa` | `#0c0d12` | General text readability |

---

## Available Commands & Scripts

Since this is a static website, there are no compile scripts. Helpful utilities include:

- **Launch Local Python Server**: `python -m http.server 8000`
- **Lint Check Git Files**: `git status`

---

## Deployment

### Vercel (Static Hosting)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root directory.
3. Link your project and accept default settings (since there is no build step).

### GitHub Pages
1. Go to your repository settings on GitHub.
2. Navigate to **Pages** in the sidebar.
3. Select the deployment branch (e.g. `main`) and root folder `/` (root), then click **Save**.

---

## Troubleshooting

### Text is Not Visible or Clipped
- Ensure you have linked `style.css` in the head of your document. If you switched themes, check if `body` has the `light-theme` class.
- The app uses custom fonts `Space Grotesk`. Ensure your network allows loading assets from Google Fonts.

### Date Input Icon is Invisible
- In dark mode, the webkit indicator indicator must be inverted. If the icon is invisible on a custom browser, check that the `::-webkit-calendar-picker-indicator { filter: invert(1); }` rule is successfully loaded.

### LocalStorage is Not Persisting
- Confirm that cookies and local storage are enabled for the domain.
- If you are running multiple local applications on the same port (e.g. `localhost:3000`), local data namespaces might overlap. The app saves to key `kanban_cards` and `kanban_columns`.
