import { createBlueprint } from '../../blueprints'
import { createSaveQueue, loadWorkspace } from '../../blueprints/storage/blueprintStorage'
import { useEditorStore } from './editor.store'

const enqueueSave = createSaveQueue()
let initialization: Promise<void> | undefined
let subscribed = false

export const retrySave = (): void => {
  const state = useEditorStore.getState()
  const revision = state.revision
  useEditorStore.setState({ saveStatus: 'saving', storageError: null })
  void enqueueSave({ schemaVersion: 1, activeId: state.activeId, blueprints: state.blueprints })
    .then(() => {
      if (useEditorStore.getState().revision === revision) {
        useEditorStore.setState({ saveStatus: 'saved', storageError: null })
      }
    }).catch(() => {
      if (useEditorStore.getState().revision === revision) {
        useEditorStore.setState({ saveStatus: 'error',
          storageError: 'Changes are only in memory. Browser storage may be full or unavailable. Free space or enable site storage, then retry before closing.' })
      }
    })
}

export const initializeWorkspace = (): Promise<void> => {
  if (initialization) return initialization
  useEditorStore.setState({ saveStatus: 'loading', storageError: null })
  initialization = loadWorkspace().then((snapshot) => {
    const first = snapshot ? null : createBlueprint('My first blueprint')
    useEditorStore.setState({
      blueprints: snapshot?.blueprints ?? (first ? [first] : []),
      activeId: snapshot?.activeId ?? first?.id ?? null,
      saveStatus: 'saved', storageError: null,
    })
    if (!subscribed) {
      useEditorStore.subscribe((state, previous) => {
        if (state.revision !== previous.revision) retrySave()
      })
      subscribed = true
    }
    if (first) retrySave()
  }).catch(() => {
    initialization = undefined
    useEditorStore.setState({ saveStatus: 'load-error',
      storageError: 'Saved blueprints could not be read. Enable browser storage or close other editor tabs, then retry. Existing storage has not been replaced.' })
  })
  return initialization
}
