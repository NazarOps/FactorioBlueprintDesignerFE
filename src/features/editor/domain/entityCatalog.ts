import type { Prototype } from '../../blueprints'

export type EntityDefinition = {
  name: string
  category: 'Logistics' | 'Production' | 'Storage' | 'Power'
  width: number
  height: number
  color: number
  symbol: string
}

export const ENTITY_CATALOG: Record<Prototype, EntityDefinition> = {
  'transport-belt': { name: 'Transport belt', category: 'Logistics', width: 1, height: 1, color: 0xd6ae49, symbol: '≋' },
  'fast-transport-belt': { name: 'Fast transport belt', category: 'Logistics', width: 1, height: 1, color: 0xd76954, symbol: '≋' },
  inserter: { name: 'Inserter', category: 'Logistics', width: 1, height: 1, color: 0xe2af42, symbol: '↗' },
  'fast-inserter': { name: 'Fast inserter', category: 'Logistics', width: 1, height: 1, color: 0x50a7c8, symbol: '↗' },
  'assembling-machine-1': { name: 'Assembling machine 1', category: 'Production', width: 3, height: 3, color: 0x7897ad, symbol: '⚙' },
  'stone-furnace': { name: 'Stone furnace', category: 'Production', width: 2, height: 2, color: 0xc28e68, symbol: '♨' },
  'wooden-chest': { name: 'Wooden chest', category: 'Storage', width: 1, height: 1, color: 0xaf8256, symbol: '▣' },
  'steel-chest': { name: 'Steel chest', category: 'Storage', width: 1, height: 1, color: 0xaab4bd, symbol: '▣' },
  'small-electric-pole': { name: 'Small electric pole', category: 'Power', width: 1, height: 1, color: 0x95aa76, symbol: 'ϟ' },
}

export const CATEGORIES = ['All entities', 'Logistics', 'Production', 'Storage', 'Power'] as const
export const DIRECTIONS = ['North', 'East', 'South', 'West'] as const
