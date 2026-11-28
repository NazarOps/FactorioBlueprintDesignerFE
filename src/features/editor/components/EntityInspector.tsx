import { Icon } from '../../../shared/ui/Icon'
import { activeBlueprint, useEditorStore } from '../store/editor.store'
import { DIRECTIONS, ENTITY_CATALOG } from '../domain/entityCatalog'
import { EntityIcon } from './EntityIcon'

export const EntityInspector = () => {
  const state = useEditorStore()
  const entities = activeBlueprint(state)?.entities ?? []
  const entity = entities.find((item) => item.id === state.selectedId)
  const definition = entity ? ENTITY_CATALOG[entity.prototype] : null
  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-l border-line bg-panel xl:flex" aria-label="Entity inspector">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-5 text-sm font-semibold"><Icon name="chip" /> Inspector</div>
      <div className="p-5">
        {entity && definition ? <>
          <EntityIcon key={entity.prototype} prototype={entity.prototype} large />
          <h2 className="mb-1 mt-4 font-semibold">{definition.name}</h2>
          <p className="break-all font-mono text-xs text-muted">{entity.prototype}</p>
          <dl className="my-6 grid grid-cols-2 gap-y-4 text-sm">
            <dt className="text-muted">Position</dt><dd className="font-mono">{entity.x}, {entity.y}</dd>
            <dt className="text-muted">Direction</dt><dd>{definition.rotatable ? DIRECTIONS[entity.direction] : 'Not applicable'}</dd>
            <dt className="text-muted">Footprint</dt><dd>{definition.width} × {definition.height}</dd>
          </dl>
          <p className="mb-3 text-xs text-muted">Drag on the grid, or focus the grid and use arrow keys to move one tile.</p>
          {!definition.rotatable && <p className="mb-3 text-xs text-muted">{entity.prototype === 'assembling-machine-1'
            ? 'Assembling machine 1 has no fluid connections and cannot rotate.'
            : 'This entity has no rotatable orientation.'}</p>}
          <div className="grid gap-2">
            <button disabled={!definition.rotatable} className="flex items-center justify-center gap-2 border border-line bg-raised px-3 py-2 text-sm hover:border-accent/50 disabled:opacity-30" onClick={state.rotate}><Icon name="rotate" /> Rotate clockwise</button>
            <button className="flex items-center justify-center gap-2 border border-line px-3 py-2 text-sm text-red-300 hover:bg-red-400/10" onClick={() => state.remove()}><Icon name="trash" /> Remove entity</button>
          </div>
        </> : <div className="py-5 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full border border-line text-muted"><Icon name="select" /></span>
          <h2 className="mb-2 mt-4 text-sm font-medium">Nothing selected</h2><p className="text-sm leading-relaxed text-muted">Use the selection tool and click an entity to inspect or edit it.</p></div>}
      </div>
      <div className="border-t border-line p-5">
        <h2 className="mb-3 text-sm font-semibold">Placed entities <span className="ml-1 font-mono text-xs text-muted">{entities.length}</span></h2>
        {!entities.length && <p className="text-sm leading-relaxed text-muted">Your layout starts with a single entity. Choose one from the palette.</p>}
        <ul className="max-h-64 space-y-1 overflow-y-auto" aria-label="Placed entities">
          {entities.map((item, index) => <li key={item.id}><button onClick={() => { state.setTool('select'); state.select(item.id) }}
            className={`w-full px-2 py-2 text-left text-xs ${state.selectedId === item.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-raised'}`}>
            {index + 1}. {ENTITY_CATALOG[item.prototype].name}<span className="ml-1 font-mono">({item.x}, {item.y})</span>
          </button></li>)}
        </ul>
      </div>
      <div className="mt-auto border-t border-line p-5 text-xs leading-relaxed text-muted">Draft entity scope. Advanced settings, power networks and production simulation are outside this editor draft.</div>
    </aside>
  )
}
