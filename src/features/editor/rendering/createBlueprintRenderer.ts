import { Application, Assets, Container, Graphics, Point, Sprite, Texture } from 'pixi.js'
import type { Entity } from '../../blueprints'
import { ENTITY_CATALOG } from '../domain/entityCatalog'
import { canPlace, containsTile, footprint } from '../domain/placement'
import { activeBlueprint, useEditorStore } from '../store/editor.store'

const TILE_SIZE = 40
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2.5
type Tile = { x: number; y: number }
type Drag = { kind: 'pan'; x: number; y: number } |
  { kind: 'entity'; id: string; offset: Tile; candidate: Tile }

export const createBlueprintRenderer = async (host: HTMLElement, signal: AbortSignal): Promise<() => void> => {
  const app = new Application()
  await app.init({ width: host.clientWidth, height: host.clientHeight, background: '#171c20',
    resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
    antialias: true, autoStart: false, preference: 'webgl' })
  // StrictMode can initialize a replacement while this instance is still
  // awaiting WebGL. Never release Pixi's process-wide pools from one instance.
  if (signal.aborted) { app.destroy({ removeView: true, releaseGlobalResources: false }, { children: true }); return () => undefined }

  const canvas = app.canvas
  canvas.setAttribute('aria-label', 'Blueprint grid. Choose an entity to place; select and drag to move. Use toolbar commands to edit.')
  canvas.tabIndex = 0
  canvas.style.touchAction = 'none'
  canvas.style.display = 'block'
  host.appendChild(canvas)
  const world = new Container()
  const grid = new Graphics()
  const entitiesLayer = new Container()
  const overlay = new Graphics()
  world.addChild(grid, entitiesLayer, overlay)
  app.stage.addChild(world)
  const textures = new Map<string, Texture>()
  let hover: Tile | null = null
  let drag: Drag | null = null
  let spacePressed = false
  let pointerId: number | null = null
  let disposed = false
  let width = host.clientWidth
  let height = host.clientHeight
  let zoom = 1

  const tileAt = (event: PointerEvent): Tile => {
    const bounds = canvas.getBoundingClientRect()
    const point = world.toLocal(new Point(event.clientX - bounds.left, event.clientY - bounds.top))
    return { x: Math.floor(point.x / TILE_SIZE), y: Math.floor(point.y / TILE_SIZE) }
  }
  const hitAt = (tile: Tile) => activeBlueprint(useEditorStore.getState())?.entities
    .findLast((entity) => containsTile(entity, tile.x, tile.y))

  const drawEntity = (entity: Entity) => {
    const definition = ENTITY_CATALOG[entity.prototype]
    const size = footprint(entity)
    const w = size.width * TILE_SIZE
    const h = size.height * TILE_SIZE
    const container = new Container({ x: entity.x * TILE_SIZE, y: entity.y * TILE_SIZE })
    const shape = new Graphics()
    shape.roundRect(3, 3, w - 6, h - 6, 3).fill({ color: definition.color, alpha: 0.18 })
      .stroke({ color: definition.color, width: 1.5, alpha: 0.8 })
    // A readable schematic remains available without copyrighted local assets.
    shape.roundRect(w * 0.25, h * 0.25, w * 0.5, h * 0.5, 2).fill({ color: definition.color, alpha: 0.65 })
    container.addChild(shape)
    const texture = textures.get(entity.prototype)
    if (texture) {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.position.set(w / 2, h / 2)
      const side = Math.min(w, h) * 0.79
      sprite.width = side
      sprite.height = side
      sprite.rotation = entity.direction * Math.PI / 2
      container.addChild(sprite)
    }
    // Explicit direction marker makes rotation visible even for symmetric icons.
    const marker = new Graphics()
    marker.poly([0, -6, 4, 1, -4, 1]).fill(0xf5d58f)
    marker.position.set(w / 2, h / 2)
    marker.rotation = entity.direction * Math.PI / 2
    const offsets = [[0, -h / 2 + 7], [w / 2 - 7, 0], [0, h / 2 - 7], [-w / 2 + 7, 0]]
    const offset = offsets[entity.direction]
    marker.x += offset[0]
    marker.y += offset[1]
    container.addChild(marker)
    entitiesLayer.addChild(container)
  }

  const draw = () => {
    if (disposed) return
    const state = useEditorStore.getState()
    const document = activeBlueprint(state)
    grid.clear()
    overlay.clear()
    const left = Math.floor(-world.x / (TILE_SIZE * zoom)) - 1
    const top = Math.floor(-world.y / (TILE_SIZE * zoom)) - 1
    const right = left + Math.ceil(width / (TILE_SIZE * zoom)) + 2
    const bottom = top + Math.ceil(height / (TILE_SIZE * zoom)) + 2
    for (let x = left; x <= right; x++) {
      grid.moveTo(x * TILE_SIZE, top * TILE_SIZE).lineTo(x * TILE_SIZE, bottom * TILE_SIZE)
        .stroke({ color: x === 0 ? 0x53606a : x % 5 === 0 ? 0x354149 : 0x293238, width: 1 / zoom })
    }
    for (let y = top; y <= bottom; y++) {
      grid.moveTo(left * TILE_SIZE, y * TILE_SIZE).lineTo(right * TILE_SIZE, y * TILE_SIZE)
        .stroke({ color: y === 0 ? 0x53606a : y % 5 === 0 ? 0x354149 : 0x293238, width: 1 / zoom })
    }
    for (const child of entitiesLayer.removeChildren()) child.destroy({ children: true })
    for (const entity of document?.entities ?? []) {
      drawEntity(entity)
      if (entity.id === state.selectedId) {
        const size = footprint(entity)
        overlay.rect(entity.x * TILE_SIZE + 1, entity.y * TILE_SIZE + 1,
          size.width * TILE_SIZE - 2, size.height * TILE_SIZE - 2).stroke({ color: 0xf3b44b, width: 2 / zoom })
      }
    }
    let preview: Entity | undefined
    if (hover && state.tool === 'place') {
      preview = { id: 'preview', prototype: state.prototype, direction: state.direction, ...hover }
    }
    if (drag?.kind === 'entity') {
      const draggedId = drag.id
      const source = document?.entities.find((entity) => entity.id === draggedId)
      if (source) preview = { ...source, ...drag.candidate }
    }
    if (preview && document) {
      const size = footprint(preview)
      const color = canPlace(preview, document.entities) ? 0xf3b44b : 0xf07870
      overlay.rect(preview.x * TILE_SIZE + 2, preview.y * TILE_SIZE + 2,
        size.width * TILE_SIZE - 4, size.height * TILE_SIZE - 4)
        .fill({ color, alpha: 0.2 }).stroke({ color, width: 2 / zoom })
    }
    canvas.style.cursor = drag?.kind === 'pan' ? 'grabbing'
      : state.tool === 'pan' || spacePressed ? 'grab' : state.tool === 'select' ? 'default' : 'crosshair'
    app.render()
  }

  const setZoom = (next: number, anchorX = width / 2, anchorY = height / 2) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
    const ratio = clamped / zoom
    world.position.set(anchorX - (anchorX - world.x) * ratio, anchorY - (anchorY - world.y) * ratio)
    zoom = clamped
    world.scale.set(zoom)
    useEditorStore.setState({ zoom })
    draw()
  }
  const fit = () => {
    const entities = activeBlueprint(useEditorStore.getState())?.entities ?? []
    let centerX = 0
    let centerY = 0
    let nextZoom = 1
    if (entities.length) {
      const minX = Math.min(...entities.map((entity) => entity.x))
      const minY = Math.min(...entities.map((entity) => entity.y))
      const maxX = Math.max(...entities.map((entity) => entity.x + footprint(entity).width))
      const maxY = Math.max(...entities.map((entity) => entity.y + footprint(entity).height))
      centerX = (minX + maxX) * TILE_SIZE / 2
      centerY = (minY + maxY) * TILE_SIZE / 2
      nextZoom = Math.min(1, (width - 100) / ((maxX - minX) * TILE_SIZE), (height - 100) / ((maxY - minY) * TILE_SIZE))
    }
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom))
    world.scale.set(zoom)
    world.position.set(width / 2 - centerX * zoom, height / 2 - centerY * zoom)
    useEditorStore.setState({ zoom })
    draw()
  }

  const handleDown = (event: PointerEvent) => {
    if (pointerId !== null || !activeBlueprint(useEditorStore.getState())) return
    if (event.button === 2) { useEditorStore.getState().setTool('select'); return }
    if (event.button !== 0 && event.button !== 1) return
    event.preventDefault()
    canvas.focus()
    pointerId = event.pointerId
    canvas.setPointerCapture(event.pointerId)
    const state = useEditorStore.getState()
    const tile = tileAt(event)
    hover = tile
    if (state.tool === 'pan' || spacePressed || event.button === 1) {
      drag = { kind: 'pan', x: event.clientX, y: event.clientY }
    } else if (state.tool === 'place') state.place(tile.x, tile.y)
    else if (state.tool === 'erase') { const hit = hitAt(tile); if (hit) state.remove(hit.id) }
    else {
      const entity = hitAt(tile)
      state.select(entity?.id ?? null)
      if (entity) drag = { kind: 'entity', id: entity.id,
        offset: { x: tile.x - entity.x, y: tile.y - entity.y }, candidate: { x: entity.x, y: entity.y } }
    }
    draw()
  }
  const handleMove = (event: PointerEvent) => {
    if (pointerId !== null && pointerId !== event.pointerId) return
    hover = tileAt(event)
    if (drag?.kind === 'pan') {
      world.x += event.clientX - drag.x
      world.y += event.clientY - drag.y
      drag = { kind: 'pan', x: event.clientX, y: event.clientY }
    } else if (drag?.kind === 'entity') {
      drag.candidate = { x: hover.x - drag.offset.x, y: hover.y - drag.offset.y }
    }
    draw()
  }
  const cancel = () => {
    drag = null
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId)
    pointerId = null
    draw()
  }
  const handleUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return
    if (drag?.kind === 'entity') {
      useEditorStore.getState().move(drag.id, drag.candidate.x, drag.candidate.y)
    }
    cancel()
  }
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    if (drag) cancel()
    hover = null
    const bounds = canvas.getBoundingClientRect()
    setZoom(zoom * Math.exp(-event.deltaY * 0.0015), event.clientX - bounds.left, event.clientY - bounds.top)
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (event.code === 'Space' && event.target === canvas) { event.preventDefault(); spacePressed = true; draw() }
    if (event.key === 'Escape') cancel()
  }
  const handleKeyUp = (event: KeyboardEvent) => { if (event.code === 'Space') { spacePressed = false; draw() } }
  const handleBlur = () => { spacePressed = false; cancel() }
  const handleLeave = () => { if (!drag) { hover = null; draw() } }
  const preventMenu = (event: Event) => event.preventDefault()
  canvas.addEventListener('pointerdown', handleDown)
  canvas.addEventListener('pointermove', handleMove)
  canvas.addEventListener('pointerup', handleUp)
  canvas.addEventListener('pointercancel', cancel)
  canvas.addEventListener('lostpointercapture', cancel)
  canvas.addEventListener('pointerleave', handleLeave)
  canvas.addEventListener('wheel', handleWheel, { passive: false })
  canvas.addEventListener('contextmenu', preventMenu)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleBlur)

  const unsubscribe = useEditorStore.subscribe((state, previous) => {
    if (state.activeId !== previous.activeId) { cancel(); hover = null; fit() }
    if (state.cameraCommand !== previous.cameraCommand) {
      if (state.cameraCommand.kind === 'fit') fit()
      else setZoom(zoom * (state.cameraCommand.kind === 'zoom-in' ? 1.2 : 1 / 1.2))
    }
    draw()
  })
  const resize = new ResizeObserver(() => {
    const nextWidth = host.clientWidth
    const nextHeight = host.clientHeight
    world.x += (nextWidth - width) / 2
    world.y += (nextHeight - height) / 2
    width = nextWidth
    height = nextHeight
    app.renderer.resize(width, height)
    draw()
  })
  resize.observe(host)
  fit()

  // These optional, ignored game assets are never required for editing/offline use.
  for (const prototype of Object.keys(ENTITY_CATALOG)) {
    void Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/factorio/item/${prototype}.png`)
      .then((texture) => { if (!disposed) { textures.set(prototype, texture); draw() } })
      .catch(() => undefined)
  }
  return () => {
    disposed = true
    unsubscribe()
    resize.disconnect()
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', handleBlur)
    canvas.removeEventListener('pointerdown', handleDown)
    canvas.removeEventListener('pointermove', handleMove)
    canvas.removeEventListener('pointerup', handleUp)
    canvas.removeEventListener('pointercancel', cancel)
    canvas.removeEventListener('lostpointercapture', cancel)
    canvas.removeEventListener('pointerleave', handleLeave)
    canvas.removeEventListener('wheel', handleWheel)
    canvas.removeEventListener('contextmenu', preventMenu)
    app.destroy({ removeView: true, releaseGlobalResources: false }, { children: true })
  }
}
