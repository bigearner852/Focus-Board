# FocusBoard

A lightweight personal task and study dashboard for planning a focused day. Add tasks, set priorities and due dates, filter what matters, and watch your completion progress — all in a single page with no account required.

![FocusBoard CI](https://github.com/bigearner852/Focus-Board/actions/workflows/ci.yml/badge.svg)

## Overview

FocusBoard keeps the task workflow deliberately small: capture a task, decide how urgent it is, and work through it. Everything is stored in the browser's `localStorage`, so the app works offline after the first load and never sends task data anywhere.

The interface is mobile-first and built around a quiet, paper-like palette with a light and dark theme. Completed tasks move below pending ones, and the overview panel keeps totals and completion percentage in view.

## Features

- **Task management** — add tasks with a title, optional description, priority (low, medium, high), and optional due date.
- **Edit and delete** — update any task from an accessible dialog; delete with a confirmation step.
- **Complete and reopen** — toggle a task between pending and completed with a keyboard-friendly checkbox.
- **Filtering** — filter by status (all, pending, completed) and priority.
- **Title search** — case-insensitive search across task titles.
- **Progress overview** — total, completed, and pending counts plus a completion percentage and progress bar.
- **Due date awareness** — overdue tasks are labelled clearly in each row.
- **Local persistence** — tasks and the chosen theme survive refreshes. Corrupted or unavailable storage is handled without breaking the app.
- **Light/dark theme** — follows the system preference on first visit and remembers an explicit choice.
- **Thoughtful empty states** — separate guidance for a brand-new board and for filters that match nothing.
- **Input validation** — required titles, length limits, and real calendar-date checks, with inline messages and `aria-invalid` states.
- **Responsive and accessible** — semantic HTML, labelled controls, visible focus rings, a skip link, and keyboard support.

## Tech stack

| Layer | Choice |
| --- | --- |
| Markup | Semantic HTML5 |
| Styling | Hand-written CSS3 (custom properties, mobile-first) |
| Application | TypeScript, compiled by Vite |
| Build tool | Vite |
| Storage | Browser `localStorage` |
| Tests | Vitest |
| Backend | None |
| Paid services | None |

## Project structure

```text
.
├── .github/workflows/ci.yml   # install, type-check, test, build
├── index.html                 # semantic app shell and task dialog
├── src/
│   ├── main.ts                # DOM rendering and event wiring
│   ├── types.ts               # Task, filters, stats, theme types
│   ├── tasks.ts               # pure validation and task operations
│   ├── storage.ts             # safe localStorage read/write
│   ├── styles.css             # responsive light/dark theme
│   ├── tasks.test.ts          # task operation tests
│   └── storage.test.ts        # persistence and corruption tests
├── LICENSE
├── README.md
├── tsconfig.json              # strict TypeScript
└── vite.config.ts             # relative build base + Vitest config
```

The split is intentional: `tasks.ts` contains no DOM or storage access, which keeps the business rules easy to test; `storage.ts` isolates all browser persistence; `main.ts` owns rendering and events.

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

### Setup

```bash
git clone https://github.com/bigearner852/Focus-Board.git
cd Focus-Board
npm install
npm run dev
```

Vite prints a local URL (by default `http://localhost:5173`). Open it in a browser.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload. |
| `npm run typecheck` | Run `tsc --noEmit` with strict settings. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run build` | Type-check, then produce a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |

## Data and privacy

- Tasks are stored under the key `focusboard.tasks.v1` and the theme under `focusboard.theme`.
- Nothing is sent to a server; clearing site data removes the board permanently.
- If storage is blocked or full, changes remain usable for the session and the app announces that they could not be saved.
- On load, stored data is validated field by field. Malformed JSON, non-array payloads, duplicate IDs, invalid priorities, and impossible dates are discarded or repaired rather than crashing the app.

## Testing

```bash
npm test
```

The suite covers:

- draft validation (empty/long titles, bad priorities, impossible dates)
- task creation, updates, toggling, and removal
- status/priority filtering, title search, and combined filters
- sorting order and stats/percentage calculations
- overdue detection against the local calendar date
- persistence round-trips and theme storage
- corrupted JSON, malformed entries, duplicate IDs, and throwing storage implementations

## Production build

```bash
npm run build
npm run preview
```

The build uses a relative base, so `dist/` can be hosted from any static path. For GitHub Pages, publish the contents of `dist/` with your preferred static-hosting workflow.

## Screenshots

No screenshot assets are committed yet, so this section documents how to add them rather than linking to missing files.

1. Run `npm run dev` and open the app.
2. Load a few sample tasks (different priorities, one completed, one overdue).
3. Capture:
   - desktop light theme at roughly 1440×900,
   - desktop dark theme,
   - mobile light theme at roughly 390×844.
4. Save the files to `docs/screenshots/` using names such as `desktop-light.png`, `desktop-dark.png`, and `mobile-light.png`.
5. Add them to this README:

```md
| Desktop (light) | Desktop (dark) |
| --- | --- |
| ![Desktop light](docs/screenshots/desktop-light.png) | ![Desktop dark](docs/screenshots/desktop-dark.png) |

![Mobile](docs/screenshots/mobile-light.png)
```

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`, `section`), a skip link, and one `h1`.
- All form controls have associated labels; validation errors are connected with `aria-describedby` and announced via a live region.
- The task dialog is a native `<dialog>` with a labelled heading and Escape-to-close behaviour.
- Custom checkboxes retain native keyboard behaviour and expose descriptive labels.
- Focus is never removed visually; edit/delete actions appear on hover but remain reachable by keyboard.
- Theme contrast and touch targets are sized for small screens; the layout respects reduced-motion preferences.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `N` | Open the new-task dialog when focus is not inside a form control. |
| `Tab` / `Shift+Tab` | Move through toolbar, tasks, and dialog controls. |
| `Escape` | Close the task dialog. |
| `Enter` / `Space` | Toggle a focused task checkbox or activate a button. |

## Browser support

Current versions of Chrome, Edge, Firefox, and Safari. The app relies on modern CSS custom properties, `color-mix()`, and the native `<dialog>` element.

## Limitations

- Data is per browser profile and device; there is no sync, export, or import.
- No due-date reminders or notifications.
- Search covers task titles only, as specified.
- No screenshot assets are included in the repository yet.

## License

[MIT](LICENSE)
