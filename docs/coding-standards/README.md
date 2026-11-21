# Frontend Coding Standards

**Scope:** Branch and commit naming, naming conventions, TypeScript coding style, and React component standards.

Related guides: [Project Structure](../project-structure/README.md) and [Tech Stack](../tech-stack/README.md). Library choices, state management, API fetching, storage, and tooling are documented in the Tech Stack guide.

## 1. Branch and commit naming

Use short-lived branches from the current default branch. No permanent `develop` branch is required.

**Branch format:** `<type>/<issue-number>-<short-kebab-case-description>`. If there is no linked issue, omit the number rather than inventing one. Branch names must be lowercase, use hyphens, and avoid spaces or special characters.

| Type | Purpose | Example without an issue number |
|---|---|---|
| `feat/` | New behavior | `feat/entity-palette` |
| `fix/` | Bug fix | `fix/autosave-ordering` |
| `refactor/` | Restructure existing code | `refactor/editor-store` |
| `test/` | Test coverage | `test/blueprint-round-trip` |
| `docs/` | Documentation | `docs/frontend-coding-standards` |
| `chore/` | Dependencies or tooling | `chore/strict-typescript` |
| `ci/` | CI workflows | `ci/frontend-checks` |

Use Conventional Commits: `<type>(<optional-scope>): <imperative summary>`.

- `feat(editor): add entity rotation`
- `fix(storage): preserve newer blueprint revisions`
- `test(api): cover invalid response bodies`
- `docs: add frontend coding standards`

Keep commits focused and exclude generated builds, secrets, debug output, unused imports, and unrelated cleanup. Commit `package-lock.json` with dependency changes.

## 2. Naming conventions and TypeScript style

| Element | Convention | Example |
|---|---|---|
| Component and component file | `PascalCase` | `BlueprintList.tsx` |
| Props type | Component name + `Props` | `BlueprintListProps` |
| Type or interface | `PascalCase` | `BlueprintSummary` |
| Custom hook and file | `use` + `PascalCase` | `useLocalBlueprints.ts` |
| Function, variable, parameter | `camelCase` | `rotateEntity`, `blueprintId` |
| Event callback prop | `on` + action | `onSelect`, `onRename` |
| Local event handler | `handle` + action | `handleRename` |
| Module constant | `UPPER_SNAKE_CASE` | `AUTOSAVE_DELAY_MS` |
| Feature folder | Lowercase domain name | `features/blueprints/` |
| Non-component module | Descriptive `camelCase` name | `importBlueprint.ts` |
| Test file | Module name + `.test` | `placement.test.ts` |

- Use `.tsx` for JSX and `.ts` for non-JSX logic. Prefer named exports for new components and utilities; keep the existing default `App` export consistent with its entry point.
- Follow the existing style: two-space indentation, single quotes in TypeScript, no unnecessary semicolons, and readable multiline JSX. Avoid unrelated formatting changes.
- Use `import type` for type-only imports, consistent with `verbatimModuleSyntax`.
- Infer obvious local types; explicitly type public function boundaries, props, and request/response contracts. Prefer simple types over clever generics.
- Use `unknown` for untrusted JSON and caught errors, then narrow or validate before use. Do not bypass checks with `any`, double assertions, or unexplained `!` assertions.
- Model meaningful alternatives with literal unions and discriminated unions. Use optional properties only when absence is valid; distinguish missing values from `null` according to the contract.
- Prefer `readonly` props and collections where callers must not mutate them. TypeScript readonly checks do not freeze nested objects at runtime.
- Use `type` for unions and aliases; either `type` or `interface` is suitable for object shapes. Keep nearby code consistent. Avoid runtime enums under the current `erasableSyntaxOnly` configuration.
- Write code that supports strict TypeScript checking. Compiler configuration and adoption status belong in the [Tech Stack](../tech-stack/README.md#tooling-and-verification).
- Do not suppress compiler or lint errors to finish a feature. Any necessary suppression must explain the constraint and have a narrow scope.

See the TypeScript references on [strict checking](https://www.typescriptlang.org/tsconfig/strict.html) and [narrowing unknown values and unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).

## 3. React component standards

- Write function components with typed props. `React.FC` is not required; let TypeScript infer the return type unless an explicit annotation helps.
- Give each component one understandable UI responsibility. Split when responsibilities diverge, rather than enforcing an arbitrary line limit.
- Keep props small and descriptive. Pass the data a component needs and callbacks describing user intent, rather than a whole application store or a general state setter.
- Prefer composition and explicit `children` typing when content is accepted. Use discriminated props when modes require different fields instead of several conflicting booleans.
- Keep renders pure: no storage writes, requests, subscriptions, or mutation of props/state during rendering. Create persistent entity IDs when handling creation, not on every render.
- Declare components at module scope. Defining a component inside another component gives it a new identity on each render and can reset its state.
- Render collections with stable domain IDs as keys. Array indexes are unsuitable for entities that can be inserted, removed, moved, or reordered.
- Show appropriate loading, empty, success, and error states for asynchronous UI. Keep recoverable failures visible with an appropriate recovery action.

These rules follow React's guidance on [component boundaries and data flow](https://react.dev/learn/thinking-in-react), [typed components](https://react.dev/learn/typescript), and [pure rendering](https://react.dev/reference/rules/components-and-hooks-must-be-pure).

### Example: a focused, typed component

```tsx
type BlueprintSummary = {
  readonly id: string
  readonly name: string
}

type BlueprintListProps = {
  readonly blueprints: readonly BlueprintSummary[]
  readonly selectedId: string | null
  readonly onSelect: (blueprintId: string) => void
}

export function BlueprintList({
  blueprints,
  selectedId,
  onSelect,
}: BlueprintListProps) {
  if (blueprints.length === 0) {
    return <p>No saved blueprints yet.</p>
  }

  return (
    <ul aria-label="Saved blueprints">
      {blueprints.map((blueprint) => (
        <li key={blueprint.id}>
          <button
            type="button"
            aria-pressed={blueprint.id === selectedId}
            onClick={() => onSelect(blueprint.id)}
          >
            {blueprint.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

The ID type is illustrative. Use the agreed frontend model and map remote identifiers at the API boundary rather than assuming local and database IDs are interchangeable.

### Hooks, effects, and rendering

- Derive values such as filtered lists and counts during rendering rather than synchronizing duplicate values with effects.
- Use functional updates when the next component value depends on its previous value. Treat props and React state as immutable.
- Call ordinary hooks at the top level of function components or custom hooks. Custom hooks share logic, not automatically the same state instance.
- Handle user-triggered actions in event handlers. Reserve effects for synchronization with external systems such as listeners or a canvas renderer.
- Include every reactive dependency. Fix the dependency structure instead of disabling hook lint rules. Clean up listeners, timers, subscriptions, and obsolete asynchronous work.
- Keep `StrictMode` enabled. Effects must tolerate setup, cleanup, and setup again in development; do not hide missing cleanup with a run-once flag.
- Keep imperative renderer handles in refs. Values that drive JSX must use a mechanism that triggers rendering.
- Measure expensive rendering before adding `memo`, `useMemo`, or `useCallback`; use them for demonstrated work or required reference stability.

See React's [guidance on avoiding unnecessary effects](https://react.dev/learn/you-might-not-need-an-effect), [effect lifecycle and cleanup](https://react.dev/reference/react/useEffect), and [memoization](https://react.dev/reference/react/memo).

### Accessibility and interaction

- Use semantic HTML: buttons for actions, links for navigation, and labels associated with inputs. Give icon-only controls an accessible name. Follow [W3C's guidance on labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/).
- Preserve visible keyboard focus. Provide keyboard access to editor commands where practical; avoid capturing typing shortcuts while an input is focused. Dialogs must manage focus and support appropriate dismissal.
- Associate validation messages with their inputs. Announce significant asynchronous errors/status changes without announcing every pointer movement or autosave tick.
- Render imported names and server messages as text. Do not inject untrusted content through `dangerouslySetInnerHTML`.
