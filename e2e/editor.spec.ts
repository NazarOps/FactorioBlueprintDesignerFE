import { chromium, expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

const start = async (page: Page) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'My first blueprint' })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
}
const saved = async (page: Page) => expect(page.getByRole('status').filter({ hasText: 'All changes saved' })).toBeVisible()
const entityCount = (page: Page, count: number) => expect(page.getByLabel('Placed entities').getByRole('button')).toHaveCount(count)
const tilePoint = async (page: Page, x: number, y: number) => {
  const bounds = await page.locator('canvas').boundingBox()
  if (!bounds) throw new Error('Workspace not available')
  return { x: bounds.x + bounds.width / 2 + x * 40 + 20, y: bounds.y + bounds.height / 2 + y * 40 + 20 }
}
const clickTile = async (page: Page, x: number, y: number) => {
  const point = await tilePoint(page, x, y)
  await page.mouse.click(point.x, point.y)
}

test('place, reject overlaps, move, rotate, undo/redo, resume offline and delete', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await start(page)
  await page.getByRole('button', { name: 'Assembling machine 1 3 × 3 tiles' }).click()
  await clickTile(page, 0, 0)
  await entityCount(page, 1)
  await page.getByRole('button', { name: 'Transport belt 1 × 1 tiles', exact: true }).click()
  await clickTile(page, 1, 1)
  await expect(page.getByRole('status').filter({ hasText: 'footprint is occupied' })).toBeVisible()
  await entityCount(page, 1)
  await clickTile(page, -2, 0)
  await entityCount(page, 2)
  await page.getByRole('button', { name: 'Select (V)', exact: true }).click()
  const from = await tilePoint(page, -2, 0)
  const to = await tilePoint(page, -3, -2)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByLabel('Entity inspector')).toContainText('-3, -2')
  await page.keyboard.press('r')
  await expect(page.getByLabel('Entity inspector')).toContainText('East')
  await page.getByRole('button', { name: 'Undo (Ctrl/⌘ Z)', exact: true }).click()
  await page.getByLabel('Placed entities').getByRole('button').nth(1).click()
  await expect(page.getByLabel('Entity inspector')).toContainText('North')
  await page.getByRole('button', { name: 'Redo (Ctrl/⌘ Shift Z)', exact: true }).click()
  await page.getByRole('button', { name: 'Rename blueprint', exact: true }).click()
  await page.getByLabel('Blueprint name').fill('Iron starter')
  await page.getByRole('dialog').getByRole('button', { name: 'Rename blueprint', exact: true }).click()
  await saved(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Iron starter', exact: true })).toBeVisible()
  await entityCount(page, 2)
  await page.getByLabel('Placed entities').getByRole('button').nth(1).click()
  await expect(page.getByLabel('Entity inspector')).toContainText('-3, -2')
  await expect(page.getByLabel('Entity inspector')).toContainText('East')
  await page.screenshot({ path: 'test-results/editor-draft.png', fullPage: true })
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Rotate clockwise (R)', exact: true }).click()
  await saved(page)
  await page.getByRole('button', { name: 'Delete selected (Del)', exact: true }).click()
  await entityCount(page, 1)
  await saved(page)
  await context.setOffline(false)
  await page.reload()
  await entityCount(page, 1)
  expect(errors).toEqual([])
})

test('manages multiple blueprints and restores the active blueprint in a new tab', async ({ page, context }) => {
  await start(page)
  await page.getByRole('button', { name: 'New blueprint', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Untitled blueprint', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Wooden chest 1 × 1 tiles', exact: true }).click()
  await clickTile(page, 0, 0)
  await saved(page)
  const reopened = await context.newPage()
  await reopened.goto('/')
  await expect(reopened.getByRole('heading', { name: 'Untitled blueprint', exact: true })).toBeVisible()
  await entityCount(reopened, 1)
  await reopened.getByRole('button', { name: 'My first blueprint', exact: true }).click()
  await entityCount(reopened, 0)
  await reopened.getByRole('button', { name: 'Delete Untitled blueprint', exact: true }).click()
  await reopened.getByRole('dialog').getByRole('button', { name: 'Delete blueprint', exact: true }).click()
  await saved(reopened)
  await reopened.reload()
  await expect(reopened.getByLabel('Local blueprints').getByRole('listitem')).toHaveCount(1)
})

test('uses schematic fallbacks and keeps zoom anchored to the pointer', async ({ page }) => {
  await page.route('**/assets/factorio/**', (route) => route.abort())
  await start(page)
  await page.getByRole('button', { name: 'Transport belt 1 × 1 tiles', exact: true }).click()
  await clickTile(page, 1, 1)
  await entityCount(page, 1)
  const anchor = await tilePoint(page, 1, 1)
  await page.mouse.move(anchor.x, anchor.y)
  await page.mouse.wheel(0, -300)
  await expect(page.getByLabel('Zoom level')).not.toHaveText('100%')
  await page.getByRole('button', { name: 'Select (V)', exact: true }).click()
  await page.mouse.click(anchor.x, anchor.y)
  await expect(page.getByLabel('Entity inspector')).toContainText('Transport belt')
  await page.screenshot({ path: 'test-results/editor-fallback.png', fullPage: true })
})

test('reports failed saves, preserves the draft and retries without losing edits', async ({ page }) => {
  await start(page)
  await saved(page)
  await page.evaluate(() => {
    const original = IDBFactory.prototype.open
    Object.defineProperty(window, '__restoreStorage', { value: () => { IDBFactory.prototype.open = original }, configurable: true })
    IDBFactory.prototype.open = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError') }
  })
  await page.getByRole('button', { name: 'Transport belt 1 × 1 tiles', exact: true }).click()
  await clickTile(page, 0, 0)
  await expect(page.getByRole('alert')).toContainText('Changes are only in memory')
  await entityCount(page, 1)
  await page.evaluate(() => {
    const restore: unknown = Reflect.get(window, '__restoreStorage')
    if (typeof restore === 'function') restore()
  })
  await page.getByRole('button', { name: 'Retry storage', exact: true }).click()
  await saved(page)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.reload()
  await entityCount(page, 1)
})

test('restores saved work after closing and restarting the browser', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'This persistent-profile smoke test uses Chromium.')
  // Keep the profile short: this checkout's nested output path exceeds Windows
  // path limits for Chromium's on-disk IndexedDB files.
  const profile = await mkdtemp(join(tmpdir(), 'factorio-editor-'))
  const options = { headless: true, viewport: { width: 1440, height: 1000 }, args: ['--enable-unsafe-swiftshader'] }
  const first = await chromium.launchPersistentContext(profile, options)
  try {
    const page = await first.newPage()
    await page.goto('http://127.0.0.1:5174')
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Stone furnace 2 × 2 tiles', exact: true }).click()
    await clickTile(page, 0, 0)
    await saved(page)
  } finally { await first.close() }
  const second = await chromium.launchPersistentContext(profile, options)
  try {
    const page = await second.newPage()
    await page.goto('http://127.0.0.1:5174')
    await expect(page.getByRole('heading', { name: 'My first blueprint', exact: true })).toBeVisible()
    await entityCount(page, 1)
    await page.getByLabel('Placed entities').getByRole('button').click()
    await expect(page.getByLabel('Entity inspector')).toContainText('Stone furnace')
  } finally {
    await second.close()
    const resolvedProfile = resolve(profile)
    if (resolvedProfile.startsWith(resolve(tmpdir()) + sep) && resolvedProfile.split(sep).at(-1)?.startsWith('factorio-editor-')) {
      await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    }
  }
})

test('cancels entity drags and preserves tile snapping after pan and resize', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Transport belt 1 × 1 tiles', exact: true }).click()
  await clickTile(page, 0, 0)
  await page.getByRole('button', { name: 'Select (V)', exact: true }).click()
  const from = await tilePoint(page, 0, 0)
  const to = await tilePoint(page, 2, 0)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 4 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(page.getByLabel('Placed entities')).toContainText('(0, 0)')
  await page.getByRole('button', { name: 'Pan (H or hold Space)', exact: true }).click()
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 80, from.y + 40, { steps: 4 })
  await page.mouse.up()
  await page.setViewportSize({ width: 1360, height: 900 })
  await page.getByRole('button', { name: 'Transport belt 1 × 1 tiles', exact: true }).click()
  const tile = await tilePoint(page, 2, 0)
  await page.mouse.click(tile.x + 80, tile.y + 40)
  await entityCount(page, 2)
  await expect(page.getByLabel('Placed entities')).toContainText('(2, 0)')
})
