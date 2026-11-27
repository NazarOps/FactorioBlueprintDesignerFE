# Frontend progress

## Editor first draft — 2026-11-28

Branch: `feat/editor-first-draft`

Scope follows [V1 requirements](docs/Factorio_Blueprint_Designer_V1_Requirements.md): implement the Milestone 1 guest editor and automatic IndexedDB persistence together. Factorio string compatibility remains Milestone 2.

### Implemented

- Configured PixiJS, Zustand, Tailwind CSS, Zod and React Hook Form; enabled strict TypeScript checking.
- Added nine draft entity prototypes across logistics, production, storage and power. The list is provisional until the Factorio compatibility target is agreed.
- Added pure footprint, hit-testing and collision rules, including negative coordinates.
- Added placement, selection, move, rotation, deletion and up to 100 undo steps. History is scoped to the current document and resets on switching.
- Added multiple local blueprints with creation, rename, reopen and confirmed deletion.
- Added versioned, validated IndexedDB workspace records and serialized autosaves. Save success follows transaction completion; failed saves preserve the draft and expose retry.
- Built the PixiJS grid with placement previews, drag-to-move, pan, cursor-anchored zoom, fit and resizing.
- Built the palette with search/categories, toolbar, inspector, keyboard shortcuts and local-storage notice.
- Added optional local game icons with schematic rendering when those ignored assets are absent.
- Replaced the Vite starter screen and metadata.

### Validation log

- Initial unit/integration suite: **8 tests passed** for footprint collisions, editor commands/history, document independence, IndexedDB round trips, ordered writes, failed writes and deletion.
- Initial ESLint and strict TypeScript production build: **passed**.
- Browser checks found and prompted fixes for native dialog dismissal during StrictMode remount and Pixi global resource cleanup during overlapping async initialization.
- Final Chromium suite: **6 browser workflows passed**. Coverage includes placement/move/rotation/history, overlap rejection, reload, offline edits, multiple documents, new-tab restoration, deletion, missing-asset fallback, anchored zoom, failed-save recovery, drag cancellation and pan/resize grid snapping.
- Actual close/restart verification passed using a short temporary Chromium profile. A long profile path under this Windows checkout prevented Chromium's IndexedDB setup; the test now avoids that path limit and retries cleanup of briefly locked browser logs.
- Final `npm run lint`, `npm run build` and `npm test`: **passed**, with **8 unit/storage tests**.
- Reviewed the editor screenshot and retained [a UI preview](docs/screenshots/editor-draft.png). Browser traces and additional screenshots remain ignored under `test-results/`.

### Milestone 1 verification in Chromium

| Requirement group | Evidence | Result |
| --- | --- | --- |
| Create, rename, reopen, delete and keep multiple blueprints | Browser library and reload/new-tab workflows | Passed |
| Place, move, rotate, remove and reject overlapping footprints | Domain tests and actual canvas interactions | Passed |
| Automatic IndexedDB storage with ordered writes | Storage tests, browser reload and save-failure/retry checks | Passed |
| Resume after closing and restarting the browser | Persistent-profile Chromium close/relaunch test | Passed |
| Guest editing without backend/network access | Browser offline edit/save then reload | Passed |

This is a verified first draft in Chromium, not a declaration of complete V1 release acceptance. Milestone 2 and the open compatibility decisions below still apply.

### Focused commits

1. `71e5c73` — configure editor dependencies, theme and strict TypeScript.
2. `f1e04cf` — reversible editing, validated local persistence and eight behavior tests.
3. `69642c2` — PixiJS grid runtime, pointer gestures and keyboard commands.
4. `5e76db6` — searchable palette, toolbar and entity inspector.
5. `d7abf5d` — application shell, local library, rename/delete dialogs and help.
6. `b7bee1f` — preserve shared Pixi resources across asynchronous StrictMode remounts.
7. `754d2e8` — six passing Playwright scenarios and ignored test artifacts.
8. Documentation commit — this progress log, README workflow, updated setup status and UI preview.

### Remaining / release boundaries

- Milestone 2 import/export is not implemented. No game-string compatibility is claimed.
- Agree the exact prototype list and Factorio version before serialization compatibility tests.
- Confirm desktop browser support and representative performance limits. Current browser automation targets Chromium.
- No service-worker/PWA first-load offline caching; editing and saves work without a backend after loading.
- Browser-local storage can be removed by clearing site data; there is no cloud backup.
- Concurrent editing in multiple tabs is not synchronized in this draft; use one editing tab.

### Latest update

Editor first draft complete. Eight unit/storage tests, six browser workflows, lint and production build pass. Work is split into focused Conventional Commits on `feat/editor-first-draft`. No remote push or deployment has been performed.
