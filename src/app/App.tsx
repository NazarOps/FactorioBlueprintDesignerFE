import { useEffect, useState } from 'react'
import { BlueprintList, RenameBlueprintForm } from '../features/blueprints'
import { activeBlueprint, BlueprintWorkspace, EditorToolbar, EntityInspector, EntityPalette,
  initializeWorkspace, retrySave, useEditorKeyboard, useEditorStore } from '../features/editor'
import { Icon } from '../shared/ui/Icon'
import { ToolButton } from '../shared/ui/ToolButton'
import { Modal } from '../shared/ui/Modal'

type DialogState = { kind: 'rename' } | { kind: 'delete'; id: string } | { kind: 'help' } | null
const SAVE_LABELS = { loading: 'Loading workspace…', saving: 'Saving…', saved: 'All changes saved', error: 'Changes not saved', 'load-error': 'Storage unavailable' }
const TOOL_HINTS = { select: 'Click to select · Drag to move · R to rotate', place: 'Click to place · R to rotate · Esc to select', erase: 'Click an entity to remove it · Ctrl/⌘ Z to undo', pan: 'Drag to pan · Scroll to zoom' }

const App = () => {
  const state = useEditorStore()
  const blueprint = activeBlueprint(state)
  const [dialog, setDialog] = useState<DialogState>(null)
  useEditorKeyboard()
  useEffect(() => { void initializeWorkspace() }, [])
  const ready = state.saveStatus !== 'loading' && state.saveStatus !== 'load-error'
  const deleteTarget = dialog?.kind === 'delete' ? state.blueprints.find((item) => item.id === dialog.id) : null

  return (
    <div className="flex h-dvh min-h-160 flex-col overflow-hidden font-sans">
      <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-line bg-panel px-5 sm:px-7">
        <div className="flex items-center gap-3.5">
          <span className="grid size-10 place-content-center rounded border border-accent/50 bg-accent/10 text-accent"><Icon name="grid" className="size-6" /></span>
          <div><h1 className="text-lg font-semibold leading-tight tracking-tight">Factorio <span className="font-normal text-muted">Blueprint Designer</span></h1>
            <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-muted">PLAN. PLACE. BUILD.</p></div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className={`hidden items-center gap-2 text-sm sm:flex ${state.saveStatus === 'error' || state.saveStatus === 'load-error' ? 'text-red-300' : 'text-muted'}`} role="status">
            {state.saveStatus === 'saved' && <Icon name="check" className="size-4 text-emerald-400" />}
            {SAVE_LABELS[state.saveStatus]}
          </div>
          <span className="hidden border-l border-line pl-5 font-mono text-xs text-muted lg:block">LOCAL WORKSPACE</span>
          <ToolButton label="Editor help and shortcuts" icon="help" onClick={() => setDialog({ kind: 'help' })} />
        </div>
      </header>

      {state.storageError && <div role="alert" className="flex shrink-0 items-center justify-between gap-4 border-b border-red-400/40 bg-red-400/10 px-5 py-3 text-sm text-red-200">
        <p>{state.storageError}</p><button className="shrink-0 border border-red-300/50 px-3 py-1.5" onClick={() => {
          if (state.saveStatus === 'load-error') void initializeWorkspace(); else retrySave()
        }}>Retry storage</button>
      </div>}

      {!ready ? <main className="grid flex-1 place-content-center gap-3 p-8 text-center text-muted"><Icon name="grid" className="mx-auto size-10 text-accent" />
        <p>{state.saveStatus === 'loading' ? 'Opening your local workspace…' : 'Resolve the storage error above to reopen your workspace.'}</p></main> :
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-55 shrink-0 flex-col border-r border-line bg-panel md:w-64" aria-label="Blueprint library and entity palette">
            <BlueprintList blueprints={state.blueprints} activeId={state.activeId} onOpen={state.openBlueprint} onCreate={state.newBlueprint}
              onDelete={(id) => setDialog({ kind: 'delete', id })} />
            {blueprint && <EntityPalette />}
            <div className="mt-auto shrink-0 border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">Stored on this device.<br />Clearing site data deletes your blueprints.</div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col" aria-label="Blueprint editor">
            <div className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel/50 px-5 sm:px-6">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2"><h2 className="truncate text-xl font-semibold tracking-tight">{blueprint?.name ?? 'Your next factory starts here'}</h2>
                  {blueprint && <ToolButton label="Rename blueprint" icon="pencil" onClick={() => setDialog({ kind: 'rename' })} />}</div>
                <p className="text-xs text-muted">{blueprint ? `${blueprint.entities.length} ${blueprint.entities.length === 1 ? 'entity' : 'entities'} · Guest workspace · Automatically saved` : 'Create a local blueprint to start designing.'}</p>
              </div>
              <span className="hidden shrink-0 rounded border border-line px-2.5 py-1 font-mono text-xs text-muted lg:block">EDITOR DRAFT</span>
            </div>
            {blueprint ? <>
              <EditorToolbar />
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <BlueprintWorkspace />
                {!blueprint.entities.length && state.tool === 'select' && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div className="max-w-80 rounded-lg border border-line bg-panel/95 p-7 text-center shadow-xl">
                    <span className="mx-auto grid size-12 place-content-center rounded border border-accent/30 bg-accent/10 text-accent"><Icon name="plus" className="size-6" /></span>
                    <h3 className="mb-2 mt-4 text-lg font-semibold">Make room for a factory.</h3>
                    <p className="text-sm leading-relaxed text-muted">Choose an entity from the palette, then click anywhere on the grid to place it.</p>
                    <p className="mt-4 font-mono text-xs text-accent/90">Every great factory starts with one belt.</p>
                  </div>
                </div>}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-md border border-line bg-panel p-1 shadow-lg" aria-label="Workspace view">
                  <button onClick={() => state.camera('zoom-out')} aria-label="Zoom out" className="size-9 text-xl text-muted hover:bg-raised">−</button>
                  <span className="w-12 text-center font-mono text-xs text-ink" aria-label="Zoom level">{Math.round(state.zoom * 100)}%</span>
                  <button onClick={() => state.camera('zoom-in')} aria-label="Zoom in" className="size-9 text-xl text-muted hover:bg-raised">+</button>
                  <span className="mx-1 h-5 w-px bg-line" /><ToolButton label="Fit blueprint (Home)" icon="fit" onClick={() => state.camera('fit')} />
                </div>
                {state.notice && <p role="status" className="absolute left-4 top-4 max-w-[80%] rounded border border-accent/40 bg-panel px-4 py-3 text-sm text-accent">{state.notice}</p>}
              </div>
              <footer className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-t border-line bg-panel px-4 text-xs text-muted">
                <span className="truncate">{TOOL_HINTS[state.tool]}</span><span className="hidden shrink-0 font-mono lg:block">1 TILE = 1 m · GRID SNAP ON</span>
              </footer>
            </> : <div className="grid flex-1 place-content-center p-6"><button className="flex items-center gap-2 bg-accent px-5 py-3 font-semibold text-workspace" onClick={state.newBlueprint}><Icon name="plus" /> Create a blueprint</button></div>}
          </main>
          {blueprint && <EntityInspector />}
        </div>}

      {dialog?.kind === 'rename' && blueprint && <Modal title="Rename blueprint" onClose={() => setDialog(null)}>
        <RenameBlueprintForm name={blueprint.name} onCancel={() => setDialog(null)} onRename={(name) => { state.renameBlueprint(name); setDialog(null) }} />
      </Modal>}
      {dialog?.kind === 'delete' && deleteTarget && <Modal title="Delete blueprint?" onClose={() => setDialog(null)}>
        <p className="text-sm leading-relaxed text-muted">“{deleteTarget.name}” and its {deleteTarget.entities.length} entities will be removed from this browser. This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3"><button className="border border-line px-4 py-2 text-sm" onClick={() => setDialog(null)}>Cancel</button>
          <button className="bg-red-400 px-4 py-2 text-sm font-semibold text-workspace" onClick={() => { state.deleteBlueprint(deleteTarget.id); setDialog(null) }}>Delete blueprint</button></div>
      </Modal>}
      {dialog?.kind === 'help' && <Modal title="Your factory planning desk" onClose={() => setDialog(null)}>
        <p className="mb-5 text-sm leading-relaxed text-muted">Pick an entity and click to place. Switch to Select to drag existing entities. An amber outline marks your selection; red previews mean the footprint is blocked.</p>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          {Object.entries({ 'Select / Place': 'V / B', 'Erase / Pan': 'E / H', 'Rotate clockwise': 'R', 'Remove selected': 'Delete', 'Undo / Redo': 'Ctrl/⌘ Z / Shift Z', 'Pan the grid': 'Space + drag', 'Zoom': 'Mouse wheel', 'Fit blueprint': 'Home', 'Cancel / deselect': 'Escape' }).map(([label, keys]) => <div className="contents" key={label}><dt className="text-muted">{label}</dt><dd className="text-right font-mono text-xs">{keys}</dd></div>)}
        </dl>
        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">No account or backend needed. Blueprints save automatically in this browser. Clearing site data removes them. Factorio string import/export is planned for Milestone 2.</p>
      </Modal>}
    </div>
  )
}

export default App
