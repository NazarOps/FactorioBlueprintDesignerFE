import { useEffect } from 'react'
import { activeBlueprint, useEditorStore } from '../store/editor.store'

export const useEditorKeyboard = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable
        || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) || document.querySelector('dialog[open]')) return
      const state = useEditorStore.getState()
      if (state.saveStatus === 'loading' || state.saveStatus === 'load-error') return
      const modifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (modifier && key === 'z') { event.preventDefault(); if (event.shiftKey) state.redo(); else state.undo(); return }
      if (modifier && key === 'y') { event.preventDefault(); state.redo(); return }
      if (modifier || event.altKey) return
      if (key === 'v') state.setTool('select')
      if (key === 'b') state.setTool('place')
      if (key === 'e') state.setTool('erase')
      if (key === 'h') state.setTool('pan')
      if (key === 'r' && !event.repeat) state.rotate()
      if (key === 'delete' || key === 'backspace') { event.preventDefault(); state.remove() }
      if (key === 'escape') { state.select(null); state.setTool('select') }
      if (key === 'home') { event.preventDefault(); state.camera('fit') }
      if (target instanceof HTMLCanvasElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        const entity = activeBlueprint(state)?.entities.find((item) => item.id === state.selectedId)
        if (entity) state.move(entity.id, entity.x + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0),
          entity.y + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0))
      }
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (['saving', 'error'].includes(useEditorStore.getState().saveStatus)) event.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
}
