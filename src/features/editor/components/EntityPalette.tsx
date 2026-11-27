import { useState } from 'react'
import { PROTOTYPES } from '../../blueprints/blueprint.types'
import { Icon } from '../../../shared/ui/Icon'
import { CATEGORIES, ENTITY_CATALOG } from '../domain/entityCatalog'
import { useEditorStore } from '../store/editor.store'
import { EntityIcon } from './EntityIcon'

export const EntityPalette = () => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('All entities')
  const prototype = useEditorStore((state) => state.prototype)
  const tool = useEditorStore((state) => state.tool)
  const choosePrototype = useEditorStore((state) => state.choosePrototype)
  const filtered = PROTOTYPES.filter((name) => {
    const definition = ENTITY_CATALOG[name]
    return (category === 'All entities' || category === definition.category)
      && definition.name.toLowerCase().includes(query.toLowerCase())
  })
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-line" aria-labelledby="palette-heading">
      <div className="px-4 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="palette-heading" className="text-sm font-semibold tracking-wide">Entity palette</h2>
          <span className="font-mono text-xs text-muted">{PROTOTYPES.length} types</span>
        </div>
        <label className="flex items-center gap-2 rounded border border-line bg-workspace px-3 text-muted">
          <Icon name="search" className="size-4" />
          <input aria-label="Search entities" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search entities…" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-muted" />
        </label>
        <div className="my-3 flex flex-wrap gap-1.5" aria-label="Entity categories">
          {CATEGORIES.map((item) => <button key={item} aria-pressed={item === category} onClick={() => setCategory(item)}
            className={`px-2 py-1.5 text-xs ${item === category ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-raised'}`}>{item}</button>)}
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto px-2 pb-4">
        {filtered.map((name) => {
          const definition = ENTITY_CATALOG[name]
          const selected = tool === 'place' && prototype === name
          return <button key={name} aria-pressed={selected} onClick={() => choosePrototype(name)}
            className={`mb-1 flex w-full items-center gap-3 border p-2 text-left ${selected
              ? 'border-accent/50 bg-accent/10' : 'border-transparent hover:bg-raised'}`}>
            <EntityIcon prototype={name} />
            <span className="min-w-0 flex-1"><span className={`block text-sm ${selected ? 'text-accent' : 'text-ink'}`}>{definition.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{definition.width} × {definition.height} tiles</span></span>
          </button>
        })}
        {!filtered.length && <p className="px-3 py-6 text-sm text-muted">No matching entities. Try another search or category.</p>}
      </div>
    </section>
  )
}
