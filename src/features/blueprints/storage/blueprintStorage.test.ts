import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createSaveQueue, loadWorkspace, saveWorkspace } from './blueprintStorage'
import type { WorkspaceSnapshot } from './blueprintStorage'
import { createBlueprint } from '../blueprint.types'

describe('IndexedDB workspace storage', () => {
  it('round-trips names, positions, directions and deletion in a new database connection', async () => {
    const blueprint = createBlueprint('Ironworks')
    blueprint.entities.push({ id: 'belt', prototype: 'transport-belt', x: -4, y: 6, direction: 3 })
    const snapshot: WorkspaceSnapshot = { schemaVersion: 1, activeId: blueprint.id, blueprints: [blueprint] }
    await saveWorkspace(snapshot)
    expect(await loadWorkspace()).toEqual(snapshot)
    await saveWorkspace({ schemaVersion: 1, activeId: null, blueprints: [] })
    expect((await loadWorkspace())?.blueprints).toEqual([])
  })
  it('serializes rapid writes and a deletion, including after a failed write', async () => {
    const blueprint = createBlueprint()
    const snapshot: WorkspaceSnapshot = { schemaVersion: 1, activeId: blueprint.id, blueprints: [blueprint] }
    const calls: string[] = []
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => { release = resolve })
    const enqueue = createSaveQueue(async (value) => {
      calls.push(value.blueprints[0]?.name ?? 'deleted')
      if (calls.length === 1) { await gate; throw new Error('Quota exceeded') }
      await saveWorkspace(value)
    })
    const first = enqueue(snapshot)
    const failed = expect(first).rejects.toThrow('Quota exceeded')
    const renamed = enqueue({ ...snapshot, blueprints: [{ ...blueprint, name: 'Newer revision' }] })
    const deleted = enqueue({ schemaVersion: 1, activeId: null, blueprints: [] })
    await Promise.resolve()
    expect(calls).toEqual(['Untitled blueprint'])
    release()
    await failed
    await Promise.all([renamed, deleted])
    expect(calls).toEqual(['Untitled blueprint', 'Newer revision', 'deleted'])
    expect((await loadWorkspace())?.blueprints).toEqual([])
  })
  it('rejects invalid data without replacing an existing workspace', async () => {
    const valid: WorkspaceSnapshot = { schemaVersion: 1, activeId: null, blueprints: [] }
    await saveWorkspace(valid)
    await expect(saveWorkspace({ ...valid, activeId: 'missing' })).rejects.toThrow()
    expect(await loadWorkspace()).toEqual(valid)
  })
})
