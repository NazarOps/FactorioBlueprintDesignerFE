import { describe, expect, it } from 'vitest'
import type { Entity } from '../../blueprints'
import { canPlace, containsTile } from './placement'

const machine: Entity = { id: 'machine', prototype: 'assembling-machine-1', x: -2, y: -2, direction: 0 }
const belt: Entity = { id: 'belt', prototype: 'transport-belt', x: 1, y: -2, direction: 0 }

describe('tile footprints', () => {
  it('rejects partial overlap and allows touching footprint edges at negative coordinates', () => {
    expect(canPlace(belt, [machine])).toBe(true)
    expect(canPlace({ ...belt, x: 0 }, [machine])).toBe(false)
    expect(canPlace({ ...belt, x: -3 }, [machine])).toBe(true)
    expect(containsTile(machine, 0, 0)).toBe(true)
    expect(containsTile(machine, 1, 0)).toBe(false)
  })
  it('ignores the moving entity itself and rejects fractional or out-of-range coordinates', () => {
    expect(canPlace({ ...machine, x: -1 }, [machine])).toBe(true)
    expect(canPlace({ ...belt, x: 1.5 }, [])).toBe(false)
    expect(canPlace({ ...belt, x: Infinity }, [])).toBe(false)
    expect(canPlace({ ...belt, x: 100001 }, [])).toBe(false)
  })
})
