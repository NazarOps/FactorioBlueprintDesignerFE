import { create } from 'zustand'
import { createBlueprint } from '../../blueprints'
import type { Blueprint, Direction, Entity, Prototype } from '../../blueprints'
import { canPlace } from '../domain/placement'

export type Tool = 'select' | 'place' | 'erase' | 'pan'
export type SaveStatus = 'loading' | 'saving' | 'saved' | 'error' | 'load-error'

type EditorState = {
  blueprints: Blueprint[]
  activeId: string | null
  revision: number
  saveStatus: SaveStatus
  storageError: string | null
  tool: Tool
  prototype: Prototype
  direction: Direction
  selectedId: string | null
  past: Entity[][]
  future: Entity[][]
  notice: string
  zoom: number
  cameraCommand: { kind: 'fit' | 'zoom-in' | 'zoom-out'; sequence: number }
  newBlueprint: () => void
  openBlueprint: (id: string) => void
  deleteBlueprint: (id: string) => void
  renameBlueprint: (name: string) => void
  choosePrototype: (prototype: Prototype) => void
  setTool: (tool: Tool) => void
  select: (id: string | null) => void
  place: (x: number, y: number) => void
  move: (id: string, x: number, y: number) => void
  rotate: () => void
  remove: (id?: string) => void
  undo: () => void
  redo: () => void
  camera: (kind: 'fit' | 'zoom-in' | 'zoom-out') => void
}

export const activeBlueprint = (state: Pick<EditorState, 'blueprints' | 'activeId'>): Blueprint | undefined =>
  state.blueprints.find((blueprint) => blueprint.id === state.activeId)

export const useEditorStore = create<EditorState>((set, get) => {
  const commit = (entities: Entity[]) => {
    const state = get()
    const document = activeBlueprint(state)
    if (!document) return
    set({
      blueprints: state.blueprints.map((blueprint) => blueprint.id === document.id
        ? { ...blueprint, entities, updatedAt: Date.now() } : blueprint),
      past: [...state.past.slice(-99), document.entities], future: [],
      revision: state.revision + 1, notice: '',
    })
  }
  const resetSelection = { selectedId: null, past: [], future: [], notice: '' }
  return {
    blueprints: [], activeId: null, revision: 0, saveStatus: 'loading', storageError: null,
    tool: 'select', prototype: 'transport-belt', direction: 0,
    ...resetSelection, zoom: 1,
    cameraCommand: { kind: 'fit', sequence: 0 },
    newBlueprint: () => {
      const blueprint = createBlueprint()
      set((state) => ({ blueprints: [...state.blueprints, blueprint], activeId: blueprint.id,
        revision: state.revision + 1, ...resetSelection, tool: 'select' }))
    },
    openBlueprint: (id) => {
      if (!get().blueprints.some((blueprint) => blueprint.id === id) || get().activeId === id) return
      set((state) => ({ activeId: id, revision: state.revision + 1, ...resetSelection, tool: 'select' }))
    },
    deleteBlueprint: (id) => set((state) => {
      const blueprints = state.blueprints.filter((blueprint) => blueprint.id !== id)
      return { blueprints, activeId: state.activeId === id ? blueprints[0]?.id ?? null : state.activeId,
        revision: state.revision + 1, ...resetSelection }
    }),
    renameBlueprint: (name) => {
      const cleanName = name.trim()
      if (!cleanName || cleanName.length > 80 || cleanName === activeBlueprint(get())?.name) return
      set((state) => ({ blueprints: state.blueprints.map((blueprint) => blueprint.id === state.activeId
        ? { ...blueprint, name: cleanName, updatedAt: Date.now() } : blueprint), revision: state.revision + 1 }))
    },
    choosePrototype: (prototype) => set({ prototype, tool: 'place', selectedId: null, notice: '' }),
    setTool: (tool) => set({ tool, notice: '' }),
    select: (selectedId) => set({ selectedId, notice: '' }),
    place: (x, y) => {
      const state = get()
      const document = activeBlueprint(state)
      if (!document) return
      const entity: Entity = { id: crypto.randomUUID(), prototype: state.prototype, direction: state.direction, x, y }
      if (!canPlace(entity, document.entities)) {
        set({ notice: 'This footprint is occupied or outside the workspace limits.' })
        return
      }
      commit([...document.entities, entity])
    },
    move: (id, x, y) => {
      const entities = activeBlueprint(get())?.entities ?? []
      const entity = entities.find((item) => item.id === id)
      if (!entity || (entity.x === x && entity.y === y)) return
      const candidate = { ...entity, x, y }
      if (!canPlace(candidate, entities)) { set({ notice: 'Move blocked: another entity occupies this footprint.' }); return }
      commit(entities.map((item) => item.id === id ? candidate : item))
    },
    rotate: () => {
      const state = get()
      const entities = activeBlueprint(state)?.entities ?? []
      const entity = state.tool === 'place' ? undefined : entities.find((item) => item.id === state.selectedId)
      if (!entity) { set({ direction: ((state.direction + 1) % 4) as Direction }); return }
      const candidate = { ...entity, direction: ((entity.direction + 1) % 4) as Direction }
      if (!canPlace(candidate, entities)) { set({ notice: 'Rotation blocked by another entity.' }); return }
      commit(entities.map((item) => item.id === entity.id ? candidate : item))
    },
    remove: (id) => {
      const target = id ?? get().selectedId
      const entities = activeBlueprint(get())?.entities ?? []
      if (!entities.some((entity) => entity.id === target)) return
      commit(entities.filter((entity) => entity.id !== target))
      set({ selectedId: null })
    },
    undo: () => {
      const state = get()
      const document = activeBlueprint(state)
      const entities = state.past.at(-1)
      if (!document || !entities) return
      set({ blueprints: state.blueprints.map((item) => item.id === document.id
        ? { ...item, entities, updatedAt: Date.now() } : item),
      past: state.past.slice(0, -1), future: [document.entities, ...state.future],
      selectedId: null, revision: state.revision + 1, notice: '' })
    },
    redo: () => {
      const state = get()
      const document = activeBlueprint(state)
      const entities = state.future[0]
      if (!document || !entities) return
      set({ blueprints: state.blueprints.map((item) => item.id === document.id
        ? { ...item, entities, updatedAt: Date.now() } : item),
      past: [...state.past, document.entities], future: state.future.slice(1),
      selectedId: null, revision: state.revision + 1, notice: '' })
    },
    camera: (kind) => set((state) => ({ cameraCommand: { kind, sequence: state.cameraCommand.sequence + 1 } })),
  }
})
