# Frontend Tech Stack

**Scope:** Technology choices, responsibilities, integration rules, persistence, and tooling.

Related guides: [Coding Standards](../coding-standards/README.md) and [Project Structure](../project-structure/README.md).

## Delivery scope and setup status

Product scope follows [the frontend V1 requirements](../Factorio_Blueprint_Designer_V1_Requirements.md): deliver the guest editor with IndexedDB persistence first, then Factorio import/export. Accounts and cloud APIs are later work. Core editing must work without cloud services.

`package.json` and `package-lock.json` define installed versions. The editor draft configures React, TypeScript, Vite, ESLint, PixiJS, Tailwind CSS, Zustand, React Hook Form, Zod, and the Zod form resolver. Vitest, fake-indexeddb and Playwright provide behavior tests. TanStack Query, Axios and React Router remain chosen technologies for future features that need remote state, HTTP and application routes. IndexedDB uses a native, versioned adapter; no wrapper library has been selected.

## Technology overview

| Technology | Purpose | Responsibility |
|---|---|---|
| React | Application UI | Workspace host, toolbars, panels, dialogs, and forms |
| PixiJS (`pixi.js`) | Main blueprint rendering and interaction system | Grid, entities, overlays, zoom, pan, pointer input, and hit testing |
| TypeScript | Static typing | Props, domain types, validated contracts |
| Vite | Frontend development and build | Development server, assets, production bundle |
| Tailwind CSS | Styling | Utility classes, responsive/state variants, theme tokens |
| Zustand | Shared client state | Editable document, editor actions, selection/tool state |
| TanStack Query (`@tanstack/react-query`) | Server state | Queries, mutations, request lifecycle, remote cache |
| Axios | HTTP transport | API instance, headers, errors, cancellation |
| React Hook Form | Forms | Field values, touched/dirty state, submissions |
| Zod | Runtime validation | Form, API response, and external-input schemas |
| `@hookform/resolvers` | Form/schema integration | Zod resolver for React Hook Form |
| React Router | Routing | Screens, layouts, navigation, URL parameters |
| IndexedDB | Durable browser storage | Local blueprints, autosave transactions, schema migrations |
| ESLint | Static analysis | TypeScript, React Hooks, and React Refresh rules |
| npm | Package management | Scripts and reproducible lockfile-based installs |

## Data ownership

| Data | Owner |
|---|---|
| Isolated UI toggles and interactions | Component-local React state |
| Shared editable blueprint and editor controls | Zustand |
| Scene objects, camera transforms, and live pointer/drag previews | PixiJS editor runtime |
| Remote results, loading/errors, and request cache | TanStack Query |
| Unsaved form fields and form validation state | React Hook Form with Zod |
| Bookmarkable selection and shareable filters | React Router URL parameters |
| Saved guest documents | IndexedDB |

Keep each value with its owner. Load a cloud document into a separate editable Zustand draft through an explicit action; background query refetches must not silently replace unsaved edits. Do not mirror query or form state into the editor store.

## Blueprint rendering and interaction: PixiJS

PixiJS is the main rendering system for the interactive blueprint workspace. The editor feature uses it to render the blueprint and handle workspace interaction. React hosts the workspace and provides the surrounding application controls; Tailwind styles that React UI.

### Workspace responsibilities

- Render the tile grid, entity sprites, rotation/direction, selection highlights, hover feedback, placement previews, and interaction overlays.
- Implement zoom and pan through a world container's transforms. Clamp zoom to usable limits and keep the world position under the cursor stable during wheel zoom.
- Handle mouse and pointer input, wheel input, hit testing, selection, dragging, and placement gestures. Cleanly end or cancel interactions when the pointer is released outside the target, canceled, or the workspace loses focus.
- Convert screen/canvas coordinates into world and tile coordinates consistently under zoom, pan, canvas resizing, and display scaling. Apply grid snapping and domain placement rules before committing an edit.
- Manage scene layers, entity-to-sprite mappings, textures, viewport resizing, and rendering updates. Zoom/pan behavior belongs to the editor's PixiJS integration; it must be implemented using the available transforms and events.

See PixiJS's [scene objects and transforms](https://pixijs.com/8.x/guides/components/scene-objects) and [pointer events and hit testing](https://pixijs.com/8.x/guides/components/events).

### Integration with React, Zustand, and persistence

- Mount the PixiJS application through the editor's React workspace component. Initialize it once per mounted workspace and handle asynchronous initialization if the component unmounts before it completes.
- Keep PixiJS applications, containers, sprites, textures, and ticker handles in the renderer runtime. Store plain domain data in Zustand and IndexedDB; scene objects must not become persisted blueprint records.
- Translate workspace actions into typed Zustand editor commands. Keep collision and placement rules in pure domain functions so pointer interactions and toolbar/keyboard actions use the same rules.
- Update the scene from accepted document changes using stable entity IDs. Keep live drag previews, camera motion, and per-frame pointer values in the PixiJS runtime; publish values needed by React controls deliberately rather than triggering a React render for every frame.
- Treat the Zustand document as the source of truth for committed entity data. PixiJS hit testing identifies a visual target; domain validation determines whether a placement or move is allowed. Autosave persists committed document changes through the IndexedDB adapter.
- Reuse the PixiJS rendering loop for scene updates. On teardown, remove event listeners, subscriptions, and ticker callbacks, and destroy owned scene/application resources. Respect shared texture ownership when releasing assets.
- Keep keyboard commands and accessible React controls connected to the same editor actions. Surface rendering initialization or asset-loading failures with actionable UI.

See PixiJS's [application lifecycle and cleanup](https://pixijs.com/8.x/guides/components/application) and [render loop](https://pixijs.com/8.x/guides/concepts/render-loop).

## Client state: Zustand

- Keep component-only interactions in local React state. Separate transient selection, hover, pan, and zoom from the blueprint content that is persisted to IndexedDB.
- Define explicit state and action types in feature stores. Expose intent-based actions such as `placeEntity`, `rotateEntity`, and `loadBlueprint` rather than letting components perform arbitrary document mutations.
- Subscribe to the smallest needed value, for example `useEditorStore((state) => state.selectedEntityId)`. Avoid subscribing components to the entire store.
- Keep selector outputs stable. Use separate selectors or `useShallow` when returning a shallow collection of values; allocating a fresh object on every selection can cause unnecessary updates or loops. See [Zustand selector guidance](https://zustand.docs.pmnd.rs/reference/hooks/use-shallow).
- Zustand's `set` merges one level. Replace nested objects/arrays explicitly when updating them; keep state transition functions deterministic. See [immutable state and merging](https://zustand.docs.pmnd.rs/learn/guides/immutable-state-and-merging).
- Keep persistence in the IndexedDB adapter. Do not use a default localStorage-based `persist` setup as a substitute for document storage. If persistence middleware is introduced, use an explicit storage adapter, versioning, and hydration policy; persist only the intended fields.
- Handle hydration before enabling document autosave so an empty initial store cannot overwrite saved work. Reset document-scoped transient state deliberately when switching blueprints.

## API fetching: Axios and TanStack Query

These conventions apply when implementing cloud features. They do not make API connectivity a V1 editor prerequisite.

- Use a shared `axios.create` instance for base URL handling, headers, timeout policy, and transport errors. Keep Axios calls out of presentational components. Feature modules expose operations such as `getCloudBlueprint` or `saveCloudBlueprint`; TanStack Query hooks call those operations.
- Define explicit request and response DTOs matching the agreed backend contract. Map DTOs to frontend models at the boundary; do not import backend persistence models into UI design.
- Axios generics do not validate JSON. Request untrusted response data as `unknown`, validate it with a feature-owned Zod schema, then return the parsed data. Infer DTO types from schemas where appropriate instead of maintaining duplicate handwritten shapes.
- Keep Axios's default rejection of unsuccessful HTTP statuses unless the contract requires otherwise. Handle successful empty responses such as 204 explicitly rather than validating them against a JSON document schema.
- Normalize HTTP, network, invalid-response, and cancellation outcomes. Preserve status codes and backend validation details where available; give unknown/non-JSON errors a safe fallback. Do not invent a backend error envelope before the contract is agreed.
- Pass TanStack Query's query-function `signal` through feature operations to Axios's `signal` option. Preserve cancellation semantics instead of converting cancellation to a generic error. Aborting a request does not prove that the server canceled a mutation.
- Throw on failed operations so TanStack Query enters its error state. Narrow caught values with `axios.isAxiosError` and validate error payloads before reading fields. Do not return empty data or a resolved failure result that TanStack Query would treat as success.
- Encode dynamic path segments and use Axios `params` for query values. Configure the base URL once, and keep backend hostnames out of components.
- Keep interceptors focused on transport and agreed authentication behavior. Present notifications and field errors in the relevant UI; register shared interceptors once rather than on every render.

See Axios's [instance configuration](https://axios-http.com/docs/instance), [error handling](https://axios-http.com/docs/handling_errors), and [cancellation](https://axios-http.com/docs/cancellation), plus [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).

### TanStack Query conventions

- Create one stable application `QueryClient`, supplied through `QueryClientProvider`. Do not recreate it during component renders. Tests should use isolated clients.
- Use feature-owned query keys/options. Include every input affecting returned data in a serializable key, including blueprint IDs, filters, and account scope for private data. Never put credentials in keys. See [query key design](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).
- Use queries for remote reads and mutations for remote writes. Keep the cache owned by TanStack Query; do not mirror API results, loading flags, or request errors into Zustand.
- Gate cloud queries until required IDs, configuration, and authentication are available. The local guest editor must not wait for an optional cloud query to succeed.
- Choose `staleTime`, refetch behavior, and bounded retry policies deliberately. Skip retries for invalid data and permanent client errors; keep retry ownership in TanStack Query rather than stacking Axios retry loops. See [query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).
- After a successful mutation, update the relevant cache from validated response data or invalidate affected keys. Await invalidation when the submission must remain pending until refreshed data is available. See [mutation invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations).
- Use optimistic updates only with cancellation of conflicting reads, a rollback snapshot, failure recovery, and final reconciliation. Prevent duplicate submissions and do not automatically retry writes without an agreed idempotency strategy.
- Keep the local editable draft intact after a failed cloud save or background refetch. On account changes, clear or isolate private cached data and account-specific drafts.

### Configuration and security

- A future `VITE_API_BASE_URL` is public configuration. Read and validate it in the API configuration module; a missing cloud URL must not prevent guest editing.
- Never place secrets, private API keys, database credentials, or privileged tokens in frontend code or `VITE_*` variables. Vite exposes those variables to the client bundle. See [Vite environment variables](https://vite.dev/guide/env-and-mode).
- Implement future authentication according to the backend's agreed cookie/token contract. Do not introduce persistent browser token storage by default. Configure credentials and CSRF protection together when cookie authentication is added.
- Do not log credentials or complete private blueprint payloads. Client validation improves feedback; server authorization and validation remain mandatory for cloud operations.

## Forms and validation: React Hook Form and Zod

- Use React Hook Form for application forms and Zod for their validation schemas. Connect them with `zodResolver` from `@hookform/resolvers/zod`; do not duplicate field values and dirty/error state in Zustand.
- Keep schemas beside their feature and infer form types from them. If transforms, coercion, or defaults make input and output differ, distinguish `z.input<typeof schema>` from `z.output<typeof schema>` or let the resolver infer them. See the [Zod resolver integration](https://github.com/react-hook-form/resolvers#zod).
- Use `register` for native inputs and `Controller`/`useController` for controlled widgets. Do not register the same field both ways. Supply explicit `defaultValues`; handle later record loads with a deliberate reset policy that preserves dirty user edits during background refetches.
- Submit through `handleSubmit`. For cloud forms, await `mutateAsync` inside the asynchronous handler so submission state tracks completion; handle failures explicitly. Keep values after failure and reset or navigate only after confirmed success.
- Map validated server field errors with `setError` and show form-level errors for failures without a matching field. Disable repeat submissions while pending and associate errors with inputs through accessible labels and descriptions.
- Subscribe only to needed form state; use `useWatch` for dependent UI rather than watching the entire form in a large parent. Choose validation timing appropriate to the interaction.

See [React Hook Form's form API](https://react-hook-form.com/docs/useform) and [field integration guidance](https://react-hook-form.com/faqs).

Use Zod at untrusted data boundaries as well as in forms. `safeParse` suits expected invalid user input; convert failed API response parsing into a distinct invalid-response error. Use parsed output, and do not reuse a form schema as an API/import schema unless their contracts actually match. See [Zod parsing and inferred types](https://zod.dev/basics).

## Routing: React Router

- Use React Router for application routes, shared layouts, nested screens, and navigation. Keep the route configuration in `app/router.tsx` and route UI with its feature.
- Use `Link`/`NavLink` for in-app links and `useNavigate` for programmatic navigation after actions. Preserve normal link semantics and browser back/forward behavior.
- Keep bookmarkable state such as the active blueprint route and shareable filters in route/search parameters. Validate parameters with Zod where constraints apply; URL strings are untrusted input. Avoid a second independently writable copy in Zustand.
- Include required route parameters in query keys and handle invalid or missing IDs explicitly. Provide a not-found screen and appropriate route-level error recovery for the selected router mode.
- TanStack Query remains the owner of server data. If React Router loaders are used for prefetching, reuse the same query options and `QueryClient` rather than creating a separate Axios fetching/cache path. Forms use React Hook Form, with remote writes going through TanStack mutations. See [prefetching and router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching).
- Preserve unsaved local edits when moving between routes. Coordinate route changes with document persistence and draft switching; route protection for future cloud screens must leave guest editing accessible.
- Verify direct navigation, refresh, and back/forward behavior. Configure the production host's SPA fallback when using browser-history routing so deep links load the application.

React Router supports several modes; choose one during setup and follow its routing/error APIs consistently. See [React Router routing](https://reactrouter.com/start/data/routing).

## Local persistence and Factorio data

### IndexedDB

IndexedDB is the browser database for durable guest blueprints. Zustand holds the working document in memory; the query cache holds remote data. Neither replaces IndexedDB persistence. No IndexedDB wrapper library has been selected.

- Persist local blueprints through the blueprint feature's storage adapter, not component-level database calls. Share database setup and schema migration plumbing through `shared/storage/database.ts`. Keep the database schema versioned and migrations explicit.
- Expose loading, pending-save, saved, and failed-save states accurately. Mark a write successful only after its transaction completes.
- Debounce autosave where useful, but serialize writes or enforce revision ordering so an older save cannot overwrite newer edits. Scope pending writes to the blueprint ID and snapshot they belong to.
- Do not depend solely on unmount or page-unload cleanup to save work. Define how pending changes are handled when switching blueprints or deleting them; a queued write must not recreate a deleted blueprint.
- Handle unavailable storage, quota failures, and migration errors visibly. Preserve the in-memory document and offer retry or export where possible.

Guest editing and local persistence must work without an API connection after the application is available locally. Explain that clearing browser/site data can delete local work. Full offline first-load support through service-worker caching is not an agreed V1 requirement.

### Factorio import/export

Keep import/export behind the Factorio feature's serialization boundary. A compression/encoding library has not yet been selected.

- Keep internal editor models, stored records, API DTOs, and Factorio-format DTOs distinct. Convert at each boundary instead of spreading external fields throughout components.
- Validate imports before replacing the current document. Bound compressed/decompressed input sizes and warn visibly about unsupported entities or discarded settings.
- Keep placement, rotation, collision checks, and import/export transformations independently testable. The exact supported entity list and Factorio version must be agreed before compatibility acceptance tests.

## Styling: Tailwind CSS

- Style components with Tailwind utility classes in JSX. Tailwind is the project's styling system; do not introduce vanilla component stylesheets or CSS Modules as a parallel convention.
- Keep the global stylesheet focused on the Tailwind entry point, shared theme tokens, and necessary base rules. Define reusable colors, spacing, and typography through Tailwind's theme instead of repeating arbitrary values. With Tailwind v4, use `@theme` for tokens that generate utilities. See [Tailwind theme variables](https://tailwindcss.com/docs/theme).
- Keep class names complete and statically detectable. Map typed variants to full class strings, such as `primary: 'bg-amber-600 hover:bg-amber-500'`; avoid constructing fragments such as `` `bg-${color}-600` ``. See [Tailwind class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).
- Use responsive and state variants such as `md:`, `hover:`, `focus-visible:`, and `disabled:` to express behavior beside the base styles. Preserve visible focus and sufficient contrast in each state.
- Extract repeated UI patterns into React components with explicit variants. Keep utility strings readable and consistently ordered; avoid using `@apply` to recreate a separate component CSS system. See [Tailwind utility styling](https://tailwindcss.com/docs/styling-with-utility-classes).
- Use PixiJS scene transforms for blueprint entity coordinates and camera zoom/pan. For React DOM overlays, use inline styles or CSS custom properties when values are computed at runtime; keep ordinary DOM layout, color, and typography in Tailwind utilities.

## Tooling and verification

The installed development stack uses Vite, TypeScript, ESLint, and npm. `build` runs `tsc -b` before the production bundle.

The application tsconfig explicitly enables `strict`. Consider `noUncheckedIndexedAccess` for indexed entity collections in a later tooling change.

Profile editor interactions with representative layouts before introducing viewport culling, animation-frame scheduling, or workers. Document measured limits rather than inventing frame-rate or blueprint-size guarantees.

Match tests to meaningful behavior and risk:

- **Unit:** placement rules, coordinate conversion, rotation, Zustand actions/selectors, Zod schemas, DTO mapping, and Factorio transformations.
- **PixiJS workspace:** entity rendering, pointer hit testing, grid snapping after zoom/pan, cursor-anchored zoom, drag cancellation, resizing, store-to-scene updates, and cleanup after remount. Use real-browser checks for rendering and input behavior.
- **Component:** user-visible actions, accessible controls, and loading/empty/error/recovery states. Prefer role/label queries and user interactions over component internals or snapshot-only checks.
- **API boundary:** successful responses, validation errors, non-JSON failures, malformed data, empty bodies, network failures, and cancellation. Mock at the network boundary when practical.
- **Library integration:** query-key isolation and mutation invalidation, form validation/submission/server errors, and route parameters/deep links/back navigation. Use fresh Zustand state and isolated query clients between tests; configure retries explicitly for deterministic failure tests.
- **Persistence/integration:** create, rename, edit, reopen, delete, migration failures, rapid autosaves, and stale completion ordering. Verify actual IndexedDB/browser behavior for persistence claims.
- **Browser workflows:** reload/reopen saved work, edit without an available backend, and import-edit-export round trips. Invalid import must leave existing work intact; unsupported data must produce a warning.

The editor draft includes Vitest (`npm test`) with fake-indexeddb for domain/storage tests and Playwright (`npm run test:e2e`) for real-browser workflows. Install Chromium with `npx playwright install chromium` before running browser checks. React Testing Library remains an option for future component-focused tests.

### Available checks

```sh
npm ci
npm run lint
npm run build
npm test
npm run test:e2e
```

`build` runs `tsc -b` before Vite's production build. ESLint currently includes TypeScript recommended rules, React Hooks rules, and React Refresh checks. Type-aware linting and an automated formatter are future tooling decisions; do not claim they are already enforced.

Frontend CI should use the agreed Node version compatible with the locked dependencies, install with `npm ci`, and run lint and build for pull requests to the default branch. Add automated tests and their actual command when configured. Keep the Node version consistent between local development and CI.
