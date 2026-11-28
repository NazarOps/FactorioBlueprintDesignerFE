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

The eight original commits were reworded locally to add `Refs:` footers. Their file trees, authors and timestamps are unchanged; the hashes below replace the original hashes.

| Current commit | Original commit | Work | Referenced frontend issues |
| --- | --- | --- | --- |
| `77a0d65` | `71e5c73` | Dependencies, theme and strict TypeScript | #8 |
| `aaf78fb` | `f1e04cf` | Commands, catalog, persistence and unit/storage tests | #9, #10, #12, #13, #14, #15, #16, #21, #22, #23, #24 |
| `3979457` | `69642c2` | PixiJS grid, pointer gestures and keyboard commands | #11, #13, #14, #15, #26 |
| `1425b44` | `5e76db6` | Palette, toolbar and inspector | #12, #14, #15, #21, #26 |
| `1bdb2ba` | `d7abf5d` | Application shell, library, dialogs and help | #8, #16, #22, #23, #24, #25, #26 |
| `14b6c38` | `b7bee1f` | PixiJS StrictMode resource cleanup fix | #11 |
| `440a8fd` | `754d2e8` | Six Playwright workflows | #11, #13, #14, #15, #16, #21, #22, #23, #24, #25, #27 |
| `927a1f3` | `ca17884` | Progress log, README, stack status and screenshot | #7, #8, #25, #27 |

Issue numbers refer to [NazarOps/FactorioBlueprintDesignerFE](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues). These references identify contributions and do not close the issues or claim all of their acceptance criteria are complete.

### Issue traceability follow-up — 2026-11-28

- Reviewed the existing frontend issues and mapped all eight original commits to the relevant work items using non-closing `Refs:` footers. Confirmed the editor branch is absent from the remote before rewriting local history.
- Preserved the original history at local ref `refs/codex-backups/editor-first-draft-before-issue-references`. Verified the rewritten tip has exactly the same file tree as the original tip before editing documentation.
- Updated `AGENTS.md` to require issue review before implementation, issue references in commits/PRs/progress, new issues for changed requirements not already tracked, and explicit distinction between partial work and completed acceptance criteria.
- Existing issues already cover this editor draft; this traceability update does not change product requirements or require a duplicate implementation issue. The workflow documentation follows the foundation work tracked in [#8](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/8).
- Remaining issue-level work includes [#7](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/7) scope/browser decisions, [#8](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/8) routing/CI, [#17](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/17) performance measurement, and broader acceptance in [#26](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/26)/[#27](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/27). In [#24](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/24), deletion currently updates the in-memory library before the write completes; its database-confirmed UI acceptance criterion remains outstanding.
- Validation for the documentation follow-up: commit-to-issue mapping and unchanged implementation trees verified; `npm run lint`, `npm run build` and `git diff --check` passed. Prior test results above remain applicable because application and test code are unchanged.
- Follow-up commit: `docs(workflow): require frontend issue traceability`, referencing #8, contains the instruction updates and refreshed commit mapping in this log.

### Remaining / release boundaries

- Milestone 2 import/export is not implemented. No game-string compatibility is claimed.
- Agree the exact prototype list and Factorio version before serialization compatibility tests.
- Confirm desktop browser support and representative performance limits. Current browser automation targets Chromium.
- No service-worker/PWA first-load offline caching; editing and saves work without a backend after loading.
- Browser-local storage can be removed by clearing site data; there is no cloud backup.
- Concurrent editing in multiple tabs is not synchronized in this draft; use one editing tab.

### Latest update

Editor first draft complete, with the issue-level acceptance gaps documented above. Eight unit/storage tests and six browser workflows passed for the unchanged implementation. All eight original commits now reference frontend issues, and `AGENTS.md` defines the issue-tracking workflow for future implementation. No issue closure or deployment has been performed.

### README and branch publication follow-up — 2026-11-28

- Updated the README with the verified draft status, linked remaining acceptance gaps, and the contributor workflow for issue review, new requirements, commit references and progress logging. References: #7, #8, #24, #25, #26, #27 and the existing Milestone 2 issues.
- Application and test code remain unchanged; prior unit/browser results still apply. `npm run lint`, `npm run build` and `git diff --check` passed for this documentation update.
- The user requested publication of `feat/editor-first-draft` to GitHub after the focused README commit. The push result will be verified against the remote branch and reported separately.

## Prototype rotation correction — 2026-11-28

Branch: `fix/15-prototype-rotation`.

References: [#15](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/15) (prototype-specific rotation), [#12](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/12) (catalog metadata), and [#13](https://github.com/NazarOps/FactorioBlueprintDesignerFE/issues/13) (placement rules). Reviewed these issues and #7 before implementation. This fixes existing FR-10/FR-12/FR-13 acceptance criteria; no duplicate issue or expanded recipe feature was needed.

### Implemented behavior

- Added explicit rotation capabilities to the existing nine-prototype catalog. Belts and inserters retain four cardinal directions. Assembling machine 1, stone furnaces, wooden/steel chests and small electric poles cannot be manually rotated.
- Applied the same rules to placement, footprints, keyboard commands, toolbar/inspector controls and Pixi rendering. Fixed entities stay upright and have no direction arrow or misleading cardinal label. The inspector explains why assembling machine 1 cannot rotate.
- Fixed entities are placed with direction 0 even after rotating a belt. Returning to a belt/inserter retains its remembered placement direction. With nothing selected outside placement mode, rotation is a no-op.
- Rejected rotations leave the document, revision, undo/redo history and autosave stream unchanged. Old saved fixed-entity directions remain readable and are ignored when rendering; this fix does not rewrite existing stored records.
- Clarified the requirements and help text using the official wiki: [assembling machine 1](https://wiki.factorio.com/Assembling_machine_1) cannot use fluids; [assembling machine 2](https://wiki.factorio.com/Assembling_machine_2) exposes its rotatable connection only for recipes requiring or producing fluid. This is connection orientation, not rotation of the machine body.

### Validation

- `npm.cmd test`: **19 unit/storage tests passed**, covering all four directional prototypes, all five fixed prototypes, remembered placement direction, no-selection behavior, legacy data, history and the existing storage checks.
- `npm.cmd run lint` and `npm.cmd run build`: **passed** after the final application changes.
- First Chromium run: all **7 workflows passed**. On Windows, the runner waited for its npm-launched dev server during cleanup; stopping that test server allowed a successful exit. A screenshot review also identified a missing canvas-ready wait after reload in the new test; added that wait before the final browser run.
- Final `npm.cmd run test:e2e`: **7 Chromium workflows passed in 40.1 seconds**, using a separately started Vite server to avoid the Windows cleanup issue. The new workflow verifies disabled rotation in placement/selection, keyboard rejection, unchanged undo behavior, restored fixed entities and persisted belt rotation. Reviewed the [rotation screenshot](docs/screenshots/entity-rotation.png): the assembler has no direction arrow; the belt points east; both rotation controls are disabled for the selected assembler.
- `git diff --check`: **passed**.

### Remaining boundaries

- Only assembling machine 1 is currently available. Assembling machines 2/3, recipe selection, fluid ports and recipe-aware rotation are not implemented. The correction does not add these deferred settings or claim rocket-fuel layouts are supported.
- The catalog and exact Factorio compatibility target remain provisional under #7. Milestone 2 import/export and the prior release gaps above remain open. No issue is closed by this correction.
- The pre-existing local `vite.config.ts` port change is outside this fix and is preserved.
