# Frontend Project Structure

**Approach:** Feature-based organization. This is a suggested target layout, not a claim that these modules already exist. Create folders as functionality is implemented.

Related guides: [Coding Standards](../coding-standards/README.md) and [Tech Stack](../tech-stack/README.md).

## Suggested layout

```text
src/
  app/
    App.tsx                         # Application composition
    providers.tsx                   # Application providers
    queryClient.ts                  # Shared query client and defaults
    router.tsx                      # Routes and layouts
  features/
    blueprints/
      components/
        BlueprintList.tsx
        BlueprintList.test.tsx
        RenameBlueprintForm.tsx
      hooks/
        useLocalBlueprints.ts
      api/
        blueprintApi.ts             # Feature API operations and DTO mapping
        blueprintQueries.ts         # Query keys/options and mutations
      schemas/
        blueprint.schema.ts         # API response schema
        renameBlueprint.schema.ts   # Form schema
      storage/
        blueprintStorage.ts         # Blueprint records and local operations
        blueprintStorage.test.ts
      blueprint.types.ts
      index.ts                      # Small public API, when needed
    editor/
      components/
        BlueprintEditor.tsx
        BlueprintWorkspace.tsx      # React host for the PixiJS workspace
        EntityPalette.tsx
      hooks/
        useBlueprintRenderer.ts     # Mount, subscriptions, and cleanup
      rendering/
        createBlueprintRenderer.ts  # PixiJS application and scene lifecycle
        entityLayer.ts              # Sprites mapped to blueprint entity IDs
        gridLayer.ts                # Grid and workspace overlays
        camera.ts                   # Zoom, pan, and coordinate transforms
        pointerInteraction.ts       # Hit testing, dragging, and gestures
        textureCatalog.ts           # Entity texture loading and reuse
      store/
        editor.store.ts             # Editor state and actions
        editor.store.test.ts
      domain/
        placement.ts                # Pure editor operations
        placement.test.ts
        rotation.ts
      editor.types.ts
      index.ts
    factorio/
      components/
        ImportBlueprintDialog.tsx
      schemas/
        factorio.schema.ts
      serialization/
        importBlueprint.ts
        exportBlueprint.ts
        blueprintRoundTrip.test.ts
      factorio.types.ts
      index.ts
  shared/
    ui/                             # Domain-independent, reused components
      Button.tsx
    api/
      httpClient.ts                 # Shared HTTP configuration
    storage/
      database.ts                   # Database opening, schema, migrations
    lib/                            # Utilities with actual cross-feature use
  assets/
  main.tsx                          # Browser entry point
  index.css                         # Tailwind entry and shared theme tokens
docs/
  coding-standards/
    README.md
  project-structure/
    README.md
  tech-stack/
    README.md
```

The starter currently has `src/App.tsx`; move it into `app/` when implementing application composition and update its entry-point import together. The layout does not require an immediate source-code reorganization.

## Feature boundaries

- Group code by the capability it supports: `blueprints` handles document management and persistence, `editor` handles PixiJS blueprint rendering and workspace interactions, and `factorio` handles game-format import/export.
- Keep the PixiJS application, scene layers, camera, and pointer handling in `features/editor/rendering/`. React workspace components host that runtime, while pure placement rules stay in `features/editor/domain/` and committed document changes go through the editor store.
- Keep feature-specific components, hooks, stores, schemas, DTOs, API operations, storage operations, and tests inside their owning feature.
- Separate rendering, pure editor operations, persistence, transport, and serialization into focused modules within the relevant feature.
- Use `app/` to compose features, routes, and providers. Keep it free of detailed placement rules, database operations, and serialization logic.
- Use `shared/` for domain-independent code used by multiple features. Blueprint-specific persistence belongs in `features/blueprints/storage/`; shared database plumbing belongs in `shared/storage/`.
- Keep tests beside the module or component they verify. Store test fixtures with their owning feature when needed.

## Imports and dependencies

- Let `app/` import features and shared modules. Features may import shared modules; shared modules must not import features or application composition.
- When one feature needs another's functionality, expose a small public interface or compose the interaction in `app/`. Avoid reaching into another feature's private store or component internals.
- Add an `index.ts` only where a public feature boundary helps. Internal feature modules should use direct imports rather than importing their own barrel.
- Prevent circular imports. Keep transport/storage adapters independent of React components and keep domain operations independently testable.
- Move code to shared modules only after a real reuse case appears. Do not introduce generic repositories, service layers, or extra folders for hypothetical future work.

## Adding a feature

1. Identify the capability and its owning feature before adding files.
2. Add the required components and supporting modules inside that feature; use only the subfolders it needs.
3. Keep data contracts and runtime schemas at the boundaries described in the [Tech Stack](../tech-stack/README.md).
4. Connect the feature through application composition or routes and add relevant tests beside the implementation.

Cloud modules can be introduced later without blocking the guest editor or IndexedDB persistence.
