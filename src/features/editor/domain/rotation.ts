import type { Direction, Prototype } from '../../blueprints'
import { ENTITY_CATALOG } from './entityCatalog'

// Old drafts may contain directions assigned by the former rotate-everything
// command. Keep those records readable, but do not orient fixed entities by them.
export const directionForPrototype = (prototype: Prototype, direction: Direction): Direction =>
  ENTITY_CATALOG[prototype].rotatable ? direction : 0

export const rotateDirection = (direction: Direction): Direction => ((direction + 1) % 4) as Direction
