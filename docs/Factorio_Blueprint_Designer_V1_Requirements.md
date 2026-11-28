# Factorio Blueprint Designer — Version 1 Requirements

**Document type:** Functional and Non-Functional Requirements Specification  
**Status:** Draft based on previously agreed V1 scope  
**Platform:** Web (React + TypeScript)  
**Storage:** IndexedDB (local browser storage)

## 1. Purpose

Factorio Blueprint Designer is a browser-based visual editor for creating and editing Factorio blueprints. Version 1 focuses on a usable, locally persistent editor followed by compatibility with Factorio blueprint strings. Users must be able to work as guests without registering or depending on an API.

## 2. Scope and delivery milestones

### Milestone 1 — Interactive editor + local persistence

A working grid-based editor **and** automatic IndexedDB persistence are delivered together. An editor that loses all work when the browser closes does **not** meet Milestone 1.

### Milestone 2 — Factorio compatibility

Add import and export of supported Factorio blueprints using the game's blueprint-string format. The supported entity subset and fields are explicitly limited for V1; unsupported data must not silently appear to be supported.

**V1 is complete only when both milestones are met.**

### Out of scope for V1

User accounts, login/registration, PostgreSQL/cloud storage, synchronization, mandatory backend/API connectivity, native mobile app, sharing/community features, ratings, comments, favorites, teams, production simulation, throughput calculations, and advanced entity configuration are deferred. Blueprint books and full-fidelity handling of advanced Factorio data are not baseline V1 requirements unless separately agreed.

## 3. Functional requirements

Priority: **Must** = required for V1; **Should** = useful but not a release blocker without further agreement.

### 3.1 Blueprint management

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-01 | Must | Create a new blank blueprint. | User can start a new editable blueprint with a grid. |
| FR-02 | Must | Name and rename a blueprint. | Updated name is shown and retained after reopening. |
| FR-03 | Must | View and reopen locally saved blueprints. | Previously saved blueprints can be selected and restored. |
| FR-04 | Must | Delete a locally saved blueprint. | Deleted blueprint no longer appears after reload. |
| FR-05 | Must | Support multiple local blueprints. | Creating another blueprint does not overwrite an existing one. |

### 3.2 Visual editor

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-06 | Must | Display an interactive tile/grid workspace. | User can see where entities are positioned. |
| FR-07 | Must | Select an entity from a supported entity palette. | Palette exposes the V1 supported types. |
| FR-08 | Must | Place entities on the grid. | Entity appears at the selected valid position. |
| FR-09 | Must | Move placed entities. | Position updates visibly and is persisted. |
| FR-10 | Must | Rotate placed entities. | Direction updates visibly and is persisted. |
| FR-11 | Must | Remove placed entities. | Entity disappears and stays removed after reload. |
| FR-12 | Must | Maintain each placed entity's type, position and direction. | Reopening preserves these properties. |
| FR-13 | Must | Apply consistent placement rules for the supported entity types. | Invalid placement, such as disallowed overlap, is prevented or clearly rejected. |
| FR-14 | Should | Undo and redo editor operations. | Recent supported changes can be reversed and reapplied. |

**Initial entity scope:** common Factorio entities such as transport belts, inserters, assembling machines, furnaces, chests and electric poles. The exact supported prototype-name list is to be fixed before implementing the import/export compatibility tests; rails, signals and complex configurations are deferred.

**Placement and rotation clarification (2026-11-28, FR-10/FR-12/FR-13):** Rotation follows the supported prototype's game behavior. In the current draft catalog, belts and inserters have four cardinal directions; assembling machine 1, stone furnaces, chests and small electric poles do not expose manual rotation. Fixed entities have no direction marker and must not inherit the placement direction of a previously selected belt or inserter. Assembling machine 1 cannot craft with fluids. On assembling machines 2/3, a recipe requiring or producing fluid enables rotation of the fluid connection; the machine body stays upright. Those tiers and recipe configuration are not implemented by this clarification. See the [assembling machine 1](https://wiki.factorio.com/Assembling_machine_1), [assembling machine 2](https://wiki.factorio.com/Assembling_machine_2), and [inserter](https://wiki.factorio.com/Inserters) wiki references. The exact V1 catalog and compatibility target remain open.

### 3.3 Local storage and offline use

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-15 | Must | Save blueprints in IndexedDB. | Blueprint data is stored in the browser, not only in React state. |
| FR-16 | Must | Automatically save edits. | User does not need to press Save for routine changes; autosave may be debounced. |
| FR-17 | Must | Restore saved work after browser closure/revisit. | Close the page, return, and continue with the previously saved blueprint and entities. |
| FR-18 | Must | Allow guest use without registration. | All Milestone 1 features work without an account. |
| FR-19 | Must | Allow editing without an active network connection after the app is available locally. | Editor and IndexedDB operations do not require API requests. |
| FR-20 | Must | Make local-only storage behavior clear. | User is informed that clearing browser/site data can delete locally saved blueprints. |

**Offline distinction:** Independence from the backend is required. Fully offline *first-load* support (e.g., service-worker caching/PWA installation) was not explicitly agreed and is not a V1 requirement.

### 3.4 Factorio import/export (Milestone 2)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-21 | Must | Accept a Factorio blueprint string for import. | User can paste/provide a valid supported blueprint string. |
| FR-22 | Must | Decode the blueprint-string representation. | Version prefix, Base64 and zlib compression are processed correctly. |
| FR-23 | Must | Parse supported blueprint entity fields. | Supported entities are reconstructed with correct prototype name, position and direction. |
| FR-24 | Must | Render imported supported entities in the editor. | User can visually inspect and edit the imported layout. |
| FR-25 | Must | Export a supported edited blueprint to a Factorio blueprint string. | Export produces the expected prefix + Base64-encoded zlib-compressed JSON representation. |
| FR-26 | Must | Preserve supported information through import → edit → export. | Supported entity names, positions and directions remain correct. |
| FR-27 | Must | Handle malformed or invalid import strings gracefully. | Clear error shown; existing saved work is not corrupted. |
| FR-28 | Must | Warn about unsupported imported entities or settings. | Unsupported items are skipped with a visible warning, rather than silently presented as imported. |
| FR-29 | Must | Keep the import/export schema separate from the editor's internal data model. | Factorio-format fields are translated at the boundary; the editor is not coupled to the raw game JSON. |

**V1 compatibility boundary:** Base entity data includes `entity_number`, `name`, `position` and `direction`, plus the basic blueprint metadata needed to create a valid string. Advanced fields such as circuit connections, recipes, filters, inventories, control behavior and other special settings are not promised to round-trip. The user should be warned where unsupported information is discarded. Blueprint-book import/export is not included in the baseline.

## 4. Non-functional requirements

| ID | Category | Requirement | Verification |
|---|---|---|---|
| NFR-01 | Usability | The primary workflow (create, place, edit, resume, export) must be understandable without specialist configuration. | Manual end-to-end usability walkthrough. |
| NFR-02 | Responsiveness | Common editor actions should provide immediate visible feedback and remain usable for ordinary V1 blueprint sizes. | Manual interaction/performance testing with representative layouts. |
| NFR-03 | Data integrity | Autosave must not routinely overwrite newer edits with stale data; failed writes must not be silently treated as successful. | Rapid-edit and interrupted-save tests. |
| NFR-04 | Persistence | Saved blueprints survive refresh, tab closure and browser restart, provided browser storage remains intact. | Browser restart/reopen test. |
| NFR-05 | Offline independence | Core editing and local storage must not depend on API or PostgreSQL availability. | Disconnect network after loading app; edit and reopen local work. |
| NFR-06 | Error handling | Invalid imports, unsupported data and storage failures must produce actionable feedback without crashing the editor. | Negative test cases. |
| NFR-07 | Compatibility | Generated strings must follow Factorio's supported blueprint-string encoding conventions. | Round-trip tests and validation in a compatible Factorio version. |
| NFR-08 | Maintainability | Editor state, persistence and Factorio serialization should be separated into understandable modules. | Code review and targeted tests. |
| NFR-09 | Testability | Core editor operations, persistence behavior and import/export transformations should be independently testable. | Automated tests for core logic and integration flows. |
| NFR-10 | Accessibility | Controls should have discernible labels, visible focus indication and reasonable keyboard access where practical. | Keyboard and accessibility checks. |
| NFR-11 | Browser support | Target current mainstream desktop browsers with IndexedDB support; exact browser/version matrix to be confirmed. | Smoke tests in agreed browsers. |
| NFR-12 | Security/privacy | V1 must not require users to submit blueprint contents to a remote service. Imported data must be treated as untrusted input. | Network inspection and invalid-input tests. |
| NFR-13 | Extensibility | Design should permit later addition of accounts, cloud synchronization, richer entities and mobile clients without requiring them in V1. | Architecture review; no V1 dependency on deferred features. |

**Performance note:** Numeric limits for blueprint size, load time, save latency and frame rate have not yet been agreed. They should be measured and established after a representative editor prototype exists rather than presented as settled requirements.

## 5. Core user stories

- **US-01:** As a guest, I want to create a blueprint so I can start planning without an account.
- **US-02:** As a planner, I want to place, move, rotate and delete entities on a grid so I can design a layout visually.
- **US-03:** As a returning user, I want my edits to be saved automatically so I can close the browser and continue later.
- **US-04:** As a planner, I want to manage multiple saved blueprints so I can work on different designs.
- **US-05:** As a Factorio player, I want to import a blueprint string so I can edit an existing supported layout.
- **US-06:** As a Factorio player, I want to export my blueprint so I can use the design in Factorio.
- **US-07:** As a Factorio player, I want clear warnings about unsupported import data so I understand what may be missing.

## 6. Release acceptance checklist

### Milestone 1

- [ ] Create, rename, reopen and delete local blueprints.
- [ ] Place, move, rotate and remove supported entities on a visible grid.
- [ ] Save changes automatically to IndexedDB.
- [ ] Close and reopen the browser without losing saved work.
- [ ] Edit as a guest with no account or backend connection.

### Milestone 2

- [ ] Import a valid supported Factorio blueprint string.
- [ ] Display supported imported entities at correct positions/directions.
- [ ] Edit imported layouts.
- [ ] Export a compatible blueprint string.
- [ ] Verify supported-data round trips.
- [ ] Show clear errors for invalid strings and warnings for unsupported data.

## 7. Decisions still to finalize

These are **not** established requirements from the earlier discussions:

1. Exact V1 entity prototype list and Factorio game version used for compatibility tests.
2. Whether undo/redo is a mandatory release criterion or an enhancement.
3. Concrete performance thresholds and maximum supported blueprint size.
4. Exact desktop browser support matrix and minimum screen size.
5. Whether basic blueprint metadata beyond name (e.g., icons, label color and description) is editable in V1 or merely represented for valid import/export.

## 8. Planned post-V1 roadmap (not acceptance criteria)

- **Accounts and cloud:** ASP.NET Core / .NET API, Vertical Slice Architecture, CQRS + MediatR, EF Core and PostgreSQL; authenticated cloud saving/synchronization while preserving guest-local use.
- **More Factorio compatibility:** richer entity settings, blueprint books and advanced prototype support.
- **Mobile:** React Native client with local SQLite storage.
- **Advanced features:** optional simulation, production/throughput analysis and community features.

---

*This specification distinguishes previously agreed V1 functionality from implementation recommendations and decisions that remain open.*
