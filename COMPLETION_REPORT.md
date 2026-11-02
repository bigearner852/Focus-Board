# FocusBoard — Phase 2 Completion Report

**Project:** FocusBoard — lightweight personal task and study dashboard  
**Repository:** <https://github.com/bigearner852/Focus-Board>  
**Live application:** <https://bigearner852.github.io/Focus-Board/>  
**Release:** [v0.1.0](https://github.com/bigearner852/Focus-Board/releases/tag/v0.1.0)  
**Branch:** `main`  
**Report date:** November 2, 2026

---

## Outcome

Phase 2 is complete. The existing application was verified in a real browser,
two genuine accessibility defects and one mobile layout defect were fixed, real
screenshots were captured, GitHub Pages deployment was configured and verified,
and **v0.1.0** was published.

No application features were rebuilt and no artificial activity was created.

---

## Verification gates

| Check | Command | Result |
| --- | --- | --- |
| Clean install | `npm ci` | Pass, 0 vulnerabilities |
| Strict type-check | `npm run typecheck` | Pass |
| Unit tests | `npm test` | **33/33 pass** |
| Browser tests | `npm run test:e2e` | **20/20 pass** |
| Production build | `npm run build` | Pass, Vite 8.3.5 |
| Pages-base build | `VITE_BASE_PATH=/Focus-Board/ npm run build` | Pass |
| GitHub Actions CI | `CI` on `main` | Pass |
| GitHub Pages deploy | `Deploy to GitHub Pages` on `main` | Pass |

Build output:

```text
dist/index.html                  8.91 kB │ gzip 2.41 kB
dist/assets/index-DMDByh9T.css  14.45 kB │ gzip 3.97 kB
dist/assets/index-DhXe_svg.js   11.58 kB │ gzip 4.40 kB
```

---

## Browser tests performed

Playwright ran the production build through Vite preview in Chromium.
**20 tests passed, 0 failed.**

| Area | What was verified |
| --- | --- |
| Empty state | Zeroed totals, progress bar, and first-task guidance |
| Validation | Empty title blocks submit, shows inline error, keeps dialog open, sets `aria-invalid` |
| Create | Title, description, high priority, due date, counts, and persistence after reload |
| Complete | Checkbox state, completed styling, totals, 50% progress, persistence, and reopen |
| Edit | Prefilled dialog, changed title/description/priority, identity preserved, persistence after reload |
| Delete | Confirmation message, row removal, remaining tasks, persistence after reload |
| Filters | Status and priority combinations, result counts, all/pending/completed |
| Search | Case-insensitive title match, no description matching, no-match empty state |
| Clear filters | Search, status, and priority reset and all tasks return |
| Overdue | Past-due label appears, future label is normal, overdue marker clears when completed |
| Theme | Toggle changes theme, stores it, and preserves it after reload |
| Keyboard | `N` opens, `Escape` closes, focus returns to trigger, no shortcut while typing |
| Responsive | 390px, 768px, and 1440px with no horizontal page overflow |
| Narrow dialog | 320px dialog stays in viewport and stacks priority/due-date fields |
| Accessibility | axe WCAG 2 A/AA on board and dialog: no serious or critical violations |
| Screenshots | Deterministic captures at desktop light, desktop dark, and mobile |

### Live deployment smoke test

A separate Playwright run against the hosted site confirmed:

- App heading renders at 1440×900 and 390×844.
- Live JS and CSS return `200` with correct MIME types.
- A task can be created, appears immediately, and survives a reload.
- Theme toggling works and survives a reload.
- No console errors and no failed network requests.
- Horizontal overflow is `0px` at both desktop and mobile widths.

---

## Screenshots produced

All images are real captures of the production build with seeded sample data.
They were generated with `npm run screenshots`, not mocked or edited.

| File | Size |
| --- | --- |
| `docs/screenshots/desktop-light.png` | 1440×998 |
| `docs/screenshots/desktop-dark.png` | 1440×998 |
| `docs/screenshots/mobile-light.png` | 390×1321 |

They are embedded in `README.md`.

---

## Defects identified and fixed

### 1. Insufficient text contrast

Completed-task text, priority/due metadata, and edit/delete actions used opacity
dimming that reduced contrast to as low as **2.17:1** against the surface.
This failed WCAG AA.

**Fix:** removed opacity-based dimming from task text and actions while keeping
completed tasks visually distinct through muted colors and strikethrough. Axe
scans now pass for both the board and the dialog. Regression coverage lives in
`tests/e2e/accessibility.spec.ts`.

### 2. Dialog focus was not explicitly restored

Native `<dialog>` restores focus only to the previously focused element. After
an edit re-render the trigger no longer exists, and after adding a first task the
empty-state trigger is hidden.

**Fix:** track the actual trigger and return focus to it on close, with a safe
fallback to the **New task** button when it is disconnected or hidden. Covered
by the keyboard test in `tests/e2e/app.spec.ts`.

### 3. Mobile header tagline wrapped

At 390px the brand tagline wrapped to two short lines beside the header actions.

**Fix:** hide the tagline below 520px. The mobile screenshot was regenerated and
reviewed.

### Responsive verification

- 390px, 768px, and 1440px: no horizontal overflow.
- 320px: dialog stays within the viewport and the priority/date fields stack.
- Task actions remain keyboard reachable on every viewport.
- Tablets and desktops show search/status/priority in one toolbar row.

---

## GitHub Actions status

| Workflow | Scope | Status |
| --- | --- | --- |
| CI | PR #1 | Pass (45s) |
| CI | PR #2 | Pass (59s) |
| CI | `main` after PR #1 | Pass |
| CI | `main` after PR #2 | Pass |
| CI | `main` docs update | Pass (57s) |
| Deploy to GitHub Pages | initial attempt | Failed: Pages site creation returned 403 |
| Deploy to GitHub Pages | rerun after Pages enablement | Pass (1m18s) |
| Deploy to GitHub Pages | `main` docs update | Pass (57s) |

The initial Pages failure was an account-permission blocker
(`Resource not accessible by integration`), not a build failure. After GitHub
Pages was enabled with **Source: GitHub Actions**, the failed job was rerun and
completed successfully.

---

## Deployment URL and verification

**Live URL:** <https://bigearner852.github.io/Focus-Board/>

| Resource | Status | Content type |
| --- | --- | --- |
| `/Focus-Board/` HTML | `200`, 8,916 bytes | `text/html` |
| `/Focus-Board/assets/index-DMDByh9T.css` | `200`, 14,457 bytes | `text/css` |
| `/Focus-Board/assets/index-DhXe_svg.js` | `200`, 11,585 bytes | `application/javascript` |

The HTML references the deployed assets with the correct `/Focus-Board/` base
path. The hosted application also passed the live browser smoke test described
above.

---

## Release

- **Version:** `v0.1.0`
- **Title:** FocusBoard v0.1.0
- **Published:** November 2, 2026 at 09:37 UTC
- **Tag:** `v0.1.0` → `ce30a49`
- **Release type:** public, not a draft, not a pre-release
- **URL:** <https://github.com/bigearner852/Focus-Board/releases/tag/v0.1.0>
- **Demo link in release:** <https://bigearner852.github.io/Focus-Board/>

`package.json` and `package-lock.json` are set to version `0.1.0`.

---

## Commit hashes

| Commit | Description |
| --- | --- |
| `97b96d7` | test: add Playwright coverage for browser flows and viewports |
| `64ab360` | fix: meet contrast requirements and restore dialog focus |
| `837c20b` | ci: deploy GitHub Pages builds and run browser tests |
| `5128787` | docs: publish verified screenshots and demo instructions |
| `5f8e5b1` | chore(release): prepare v0.1.0 |
| `7ae9d5e` | ci: enable Pages during the deployment workflow |
| `9351a59` | Merge pull request #1 from `phase-2/verification-deploy` |
| `f7bb3af` | docs: document the Pages enablement requirement |
| `312293a` | Merge pull request #2 from `docs/deployment-status` |
| `ce30a49` | docs: mark the Pages demo as live (release tag target) |

Pull requests:

- <https://github.com/bigearner852/Focus-Board/pull/1>
- <https://github.com/bigearner852/Focus-Board/pull/2>

---

## Remaining limitations

- Data is stored per browser profile and device; there is no sync, export, or
  import.
- No due-date reminders or notifications.
- Search intentionally covers task titles only.
- Automated browser tests cover Chromium; Firefox and WebKit are supported by
  the standards used but are not part of CI.
- The screenshots use seeded sample tasks and therefore contain dates from the
  capture day rather than live user data.
