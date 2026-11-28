import { beforeEach, describe, expect, it } from 'vitest'
import { activeBlueprint, useEditorStore } from './editor.store'
import type { Direction, Prototype } from '../../blueprints'
import { directionForPrototype } from '../domain/rotation'

const store = useEditorStore
const current = () => activeBlueprint(store.getState())

beforeEach(() => {
  store.setState(store.getInitialState(), true)
  store.getState().newBlueprint()
})

describe('editor commands', () => {
  it.each<Prototype>(['transport-belt', 'fast-transport-belt', 'inserter', 'fast-inserter'])(
    'cycles placement and selected %s through four directions with reversible edits', (prototype) => {
      store.getState().choosePrototype(prototype)
      const revision = store.getState().revision
      for (const direction of [1, 2, 3, 0]) {
        store.getState().rotate()
        expect(store.getState().direction).toBe(direction)
      }
      expect(store.getState().revision).toBe(revision)
      store.getState().place(0, 0)
      store.getState().setTool('select')
      store.getState().select(current()?.entities[0].id ?? null)
      for (const direction of [1, 2, 3, 0]) {
        store.getState().rotate()
        expect(current()?.entities[0].direction).toBe(direction)
      }
      store.getState().undo()
      expect(current()?.entities[0].direction).toBe(3)
      store.getState().redo()
      expect(current()?.entities[0].direction).toBe(0)
    },
  )

  it.each<Prototype>(['assembling-machine-1', 'stone-furnace', 'wooden-chest', 'steel-chest', 'small-electric-pole'])(
    'does not rotate %s or inherit a belt direction when placing it', (prototype) => {
      store.getState().choosePrototype('transport-belt')
      store.getState().rotate()
      store.getState().choosePrototype(prototype)
      store.getState().rotate()
      expect(store.getState().direction).toBe(1)
      expect(store.getState().notice).toContain('cannot be rotated')
      store.getState().place(0, 0)
      expect(current()?.entities[0].direction).toBe(0)
      store.getState().setTool('select')
      store.getState().select(current()?.entities[0].id ?? null)
      const before = store.getState()
      store.getState().rotate()
      expect(store.getState().blueprints).toBe(before.blueprints)
      expect(store.getState().past).toBe(before.past)
      expect(store.getState().future).toBe(before.future)
      expect(store.getState().revision).toBe(before.revision)
      store.getState().choosePrototype('transport-belt')
      store.getState().place(4, 0)
      expect(current()?.entities[1].direction).toBe(1)
    },
  )

  it('ignores rotation with no selected entity instead of changing the next placement direction', () => {
    const before = store.getState()
    store.getState().rotate()
    expect(store.getState()).toBe(before)
  })

  it('reads legacy fixed-entity directions without rotating their visuals or rewriting saved records', () => {
    store.getState().choosePrototype('assembling-machine-1')
    store.getState().place(0, 0)
    store.setState((state) => ({ blueprints: state.blueprints.map((blueprint) => ({ ...blueprint,
      entities: blueprint.entities.map((entity) => ({ ...entity, direction: 3 as Direction })),
    })) }))
    store.getState().setTool('select')
    store.getState().select(current()?.entities[0].id ?? null)
    const before = store.getState()
    store.getState().rotate()
    expect(store.getState().blueprints).toBe(before.blueprints)
    expect(current()?.entities[0].direction).toBe(3)
    expect(directionForPrototype('assembling-machine-1', 3)).toBe(0)
  })

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
