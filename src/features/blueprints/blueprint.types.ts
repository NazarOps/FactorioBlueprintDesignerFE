import { z } from 'zod'

export const PROTOTYPES = [
  'transport-belt', 'fast-transport-belt', 'inserter', 'fast-inserter',
  'assembling-machine-1', 'stone-furnace', 'wooden-chest', 'steel-chest', 'small-electric-pole',
] as const

export const entitySchema = z.object({
  id: z.string().min(1),
  prototype: z.enum(PROTOTYPES),
  x: z.number().int().min(-100000).max(100000),
  y: z.number().int().min(-100000).max(100000),
  direction: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
})

export const blueprintSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  entities: z.array(entitySchema),
  updatedAt: z.number().finite(),
})

export type Blueprint = z.infer<typeof blueprintSchema>
export type Entity = z.infer<typeof entitySchema>
export type Prototype = Entity['prototype']
export type Direction = Entity['direction']

export const createBlueprint = (name = 'Untitled blueprint'): Blueprint => ({
  id: crypto.randomUUID(), name, entities: [], updatedAt: Date.now(),
})
