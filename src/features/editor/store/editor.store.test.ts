import { beforeEach, describe, expect, it } from 'vitest'
import { activeBlueprint, useEditorStore } from './editor.store'

const store = useEditorStore
const current = () => activeBlueprint(store.getState())

beforeEach(() => {
  store.setState(store.getInitialState(), true)
  store.getState().newBlueprint()
})

describe('editor commands', () => {
  it('places, moves, rotates and removes entities with reversible history', () => {
    store.getState().place(-1, 2)
    const id = current()?.entities[0].id
    expect(id).toBeDefined()
    if (!id) throw new Error('Expected a placed entity')
    store.getState().select(id)
    store.getState().move(id, 4, -3)
    store.getState().rotate()
    expect(current()?.entities[0]).toMatchObject({ x: 4, y: -3, direction: 1 })
    store.getState().remove()
    expect(current()?.entities).toHaveLength(0)
    store.getState().undo()
    expect(current()?.entities[0]).toMatchObject({ x: 4, y: -3, direction: 1 })
    store.getState().redo()
    expect(current()?.entities).toHaveLength(0)
  })
  it('rejects overlapping moves without adding history or changing the document', () => {
    store.getState().place(0, 0)
    store.getState().place(1, 0)
    const id = current()?.entities[1].id
    if (!id) throw new Error('Expected a second entity')
    const revision = store.getState().revision
    store.getState().move(id, 0, 0)
    expect(current()?.entities[1].x).toBe(1)
    expect(store.getState().revision).toBe(revision)
    expect(store.getState().notice).toContain('blocked')
  })
  it('keeps documents independent, resets history on switch, and deletes the active document', () => {
    const firstId = store.getState().activeId
    store.getState().renameBlueprint('Smelting')
    store.getState().place(0, 0)
    store.getState().newBlueprint()
    const secondId = store.getState().activeId
    expect(current()?.entities).toHaveLength(0)
    if (!firstId || !secondId) throw new Error('Expected two blueprint IDs')
    store.getState().openBlueprint(firstId)
    expect(current()?.name).toBe('Smelting')
    expect(current()?.entities).toHaveLength(1)
    store.getState().undo()
    expect(current()?.entities).toHaveLength(1)
    store.getState().deleteBlueprint(firstId)
    expect(store.getState().activeId).toBe(secondId)
    store.getState().deleteBlueprint(secondId)
    expect(store.getState().activeId).toBeNull()
  })
})
