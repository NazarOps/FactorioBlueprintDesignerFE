import { Icon } from '../../../shared/ui/Icon'
import type { Blueprint } from '../blueprint.types'

type BlueprintListProps = {
  readonly blueprints: readonly Blueprint[]
  readonly activeId: string | null
  readonly onOpen: (id: string) => void
  readonly onCreate: () => void
  readonly onDelete: (id: string) => void
}

export const BlueprintList = (props: BlueprintListProps) => (
  <section className="shrink-0 px-4 pb-4 pt-5" aria-labelledby="library-heading">
    <div className="mb-4 flex items-center justify-between">
      <h2 id="library-heading" className="text-sm font-semibold tracking-wide">My blueprints</h2>
      <span className="font-mono text-xs text-muted">{props.blueprints.length}</span>
    </div>
    <button className="mb-3 flex w-full items-center justify-center gap-2 border border-accent/45 bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/20"
      onClick={props.onCreate}><Icon name="plus" className="size-4" /> New blueprint</button>
    <ul className="max-h-44 overflow-y-auto" aria-label="Local blueprints">
      {props.blueprints.map((blueprint) => <li key={blueprint.id} className="group mb-1 flex items-center gap-1">
        <button onClick={() => props.onOpen(blueprint.id)} aria-current={props.activeId === blueprint.id ? 'page' : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm ${props.activeId === blueprint.id ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/50'}`}>
          <Icon name="folder" className={`size-4 shrink-0 ${props.activeId === blueprint.id ? 'text-accent' : ''}`} />
          <span className="truncate">{blueprint.name}</span>
        </button>
        <button onClick={() => props.onDelete(blueprint.id)} title={`Delete ${blueprint.name}`} aria-label={`Delete ${blueprint.name}`}
          className="p-2 text-muted hover:bg-red-400/10 hover:text-red-300"><Icon name="trash" className="size-4" /></button>
      </li>)}
    </ul>
    {!props.blueprints.length && <p className="py-2 text-sm text-muted">Create a blueprint to get started.</p>}
  </section>
)
