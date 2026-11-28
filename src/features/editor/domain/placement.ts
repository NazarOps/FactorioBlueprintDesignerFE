import type { Entity } from '../../blueprints'
import { ENTITY_CATALOG } from './entityCatalog'
import { directionForPrototype } from './rotation'

// Internal positions are integer tile coordinates at the footprint's top-left.
export const footprint = (entity: Entity) => {
  const definition = ENTITY_CATALOG[entity.prototype]
  const sideways = directionForPrototype(entity.prototype, entity.direction) % 2 === 1
  return {
    width: sideways ? definition.height : definition.width,
    height: sideways ? definition.width : definition.height,
  }
}

export const containsTile = (entity: Entity, x: number, y: number): boolean => {
  const size = footprint(entity)
  return x >= entity.x && y >= entity.y && x < entity.x + size.width && y < entity.y + size.height
}

export const canPlace = (candidate: Entity, entities: readonly Entity[]): boolean => {
  if (!Number.isInteger(candidate.x) || !Number.isInteger(candidate.y)
    || Math.abs(candidate.x) > 100000 || Math.abs(candidate.y) > 100000) return false
  const size = footprint(candidate)
  return entities.every((other) => {
    if (other.id === candidate.id) return true
    const otherSize = footprint(other)
    return candidate.x + size.width <= other.x || other.x + otherSize.width <= candidate.x
      || candidate.y + size.height <= other.y || other.y + otherSize.height <= candidate.y
  })
}
