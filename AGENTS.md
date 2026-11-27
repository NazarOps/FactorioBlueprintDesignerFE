# Repository Guidelines

## Project Source of Truth & Priorities

At the start of every Codex session, read [Factorio Blueprint Designer V1 Requirements](docs/Factorio_Blueprint_Designer_V1_Requirements.md) before planning or implementing work. This document is the main source of truth for the frontend client going forward: use it for project guidance, V1 scope, milestone priorities, functional and non-functional requirements, user stories, and release acceptance criteria.

Prioritize Milestone 1 (interactive editor together with automatic IndexedDB persistence) until its acceptance criteria are met, then Milestone 2 (Factorio blueprint import/export). Check the implementation against the requirements and release checklist to identify the next unfinished priority; do not assume a milestone is complete based only on existing UI or documentation. V1 requires both milestones.

Use the requirements document to resolve conflicting scope or priority guidance in other project documentation, while continuing to follow applicable coding and architecture standards. Respect its Must/Should priorities, keep deferred post-V1 features out of baseline V1 work, and treat decisions marked as open as unresolved rather than established requirements. Follow explicit user instructions when they change the agreed scope or priorities.

## Project Structure & Module Organization

This Factorio Blueprint Designer frontend currently uses React, TypeScript, and Vite. `src/main.tsx` mounts `src/App.tsx`; styles live in `src/index.css` and `src/App.css`. Bundled images belong in `src/assets/`; static files belong in `public/`. Build output goes to ignored `dist/`.

Read [Coding Standards](docs/coding-standards/README.md), [Project Structure](docs/project-structure/README.md), and [Tech Stack](docs/tech-stack/README.md) before implementing features. The planned layout uses `src/app/` for composition, `src/features/{blueprints,editor,factorio}/` for capabilities, and `src/shared/` for reused, domain-independent code. Create folders as needed. Keep rendering, domain logic, persistence, and serialization separate; shared modules must not import features.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start Vite with hot module replacement.
- `npm run lint`: run ESLint's TypeScript, React Hooks, and React Refresh checks.
- `npm run build`: run TypeScript project checks, then generate the production bundle.
- `npm run preview`: serve the built bundle locally.

Run lint and build before submitting changes. No automated formatter is configured.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes in TypeScript, and omit unnecessary semicolons. Use `.tsx` for JSX and `.ts` for logic, with `import type` for type-only imports. Prefer named exports for new modules.

Name components/files `PascalCase`, hooks `usePascalCase`, functions/variables `camelCase`, and module constants `UPPER_SNAKE_CASE`. Write new components as arrow functions with named `ComponentProps` types; access values through `props`. Validate untrusted data instead of using `any`.

## Testing Guidelines

No tests, test runner, `test` script, or coverage threshold currently exist. Introduce appropriate tooling with behavior that needs it; Vitest, React Testing Library, and Playwright are documented candidates. Colocate `*.test.ts`/`*.test.tsx` files with implementations. Prioritize placement/rotation, serialization round trips, persistence ordering, and user-visible interactions; verify rendering and pointer behavior in a real browser.

## Commit & Pull Request Guidelines

History contains short descriptive commits and merge PRs; the documented standard is Conventional Commits, e.g. `feat(editor): add entity rotation`. Use branches such as `fix/42-autosave-ordering`, omitting issue numbers when unavailable. Keep commits focused and include lockfile updates for dependency changes.

PRs should explain behavior, link relevant issues, report validation, and include screenshots for UI changes.

## Assets & Configuration

Keep original Factorio assets under ignored `public/assets/factorio/`. Exclude generated builds and secrets; `VITE_*` variables are public browser configuration.
