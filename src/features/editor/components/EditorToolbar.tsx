import { ToolButton } from '../../../shared/ui/ToolButton'
import { useEditorStore } from '../store/editor.store'
import { DIRECTIONS, ENTITY_CATALOG } from '../domain/entityCatalog'

export const EditorToolbar = () => {
  const state = useEditorStore()
  return (
    <div className="flex min-h-16 flex-wrap items-center gap-1 border-b border-line bg-panel px-4 py-2" aria-label="Editor tools" role="toolbar">
      <ToolButton label="Select (V)" icon="select" active={state.tool === 'select'} onClick={() => state.setTool('select')} />
      <ToolButton label="Place entity (B)" icon="plus" active={state.tool === 'place'} onClick={() => state.setTool('place')} />
      <ToolButton label="Pan (H or hold Space)" icon="hand" active={state.tool === 'pan'} onClick={() => state.setTool('pan')} />
      <ToolButton label="Erase (E)" icon="erase" active={state.tool === 'erase'} onClick={() => state.setTool('erase')} />
      <span className="mx-2 h-6 w-px bg-line" />
      <ToolButton label="Rotate clockwise (R)" icon="rotate" onClick={state.rotate} />
      <ToolButton label="Delete selected (Del)" icon="trash" disabled={!state.selectedId} onClick={() => state.remove()} />
      <span className="mx-2 h-6 w-px bg-line" />
      <ToolButton label="Undo (Ctrl/⌘ Z)" icon="undo" disabled={!state.past.length} onClick={state.undo} />
      <ToolButton label="Redo (Ctrl/⌘ Shift Z)" icon="redo" disabled={!state.future.length} onClick={state.redo} />
      {state.tool === 'place' && <span className="ml-auto hidden pl-2 text-xs text-muted 2xl:block">{ENTITY_CATALOG[state.prototype].name} · {DIRECTIONS[state.direction]}</span>}
    </div>
  )
}
