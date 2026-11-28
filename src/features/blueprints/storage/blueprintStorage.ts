import { z } from 'zod'
import { openDatabase, WORKSPACE_STORE } from '../../../shared/storage/database'
import { blueprintSchema } from '../blueprint.types'

const workspaceSchema = z.object({
  schemaVersion: z.literal(1),
  activeId: z.string().nullable(),
  blueprints: z.array(blueprintSchema),
}).superRefine((workspace, context) => {
  const ids = workspace.blueprints.map((blueprint) => blueprint.id)
  if (new Set(ids).size !== ids.length || (workspace.activeId !== null && !ids.includes(workspace.activeId))) {
    context.addIssue({ code: 'custom', message: 'Saved workspace contains invalid blueprint references.' })
  }
  for (const blueprint of workspace.blueprints) {
    if (new Set(blueprint.entities.map((entity) => entity.id)).size !== blueprint.entities.length) {
      context.addIssue({ code: 'custom', message: 'Saved blueprint contains duplicate entity IDs.' })
    }
  }
})

export type WorkspaceSnapshot = z.infer<typeof workspaceSchema>

export const loadWorkspace = async (): Promise<WorkspaceSnapshot | null> => {
  const database = await openDatabase()
  try {
    const value: unknown = await new Promise((resolve, reject) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readonly')
      const request = transaction.objectStore(WORKSPACE_STORE).get('local')
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? new Error('Could not read saved blueprints.'))
      transaction.onerror = () => reject(transaction.error)
    })
    return value === undefined ? null : workspaceSchema.parse(value)
  } finally {
    database.close()
  }
}

export const saveWorkspace = async (snapshot: WorkspaceSnapshot): Promise<void> => {
  const record = workspaceSchema.parse(snapshot)
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readwrite')
      transaction.objectStore(WORKSPACE_STORE).put(record, 'local')
      // Request success is insufficient: only transaction completion means saved.
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error ?? new Error('Browser storage write was interrupted.'))
      transaction.onerror = () => reject(transaction.error ?? new Error('Browser storage write failed.'))
    })
  } finally {
    database.close()
  }
}

// One ordered stream per tab. A deletion is an entire library snapshot, so an
// earlier queued write cannot subsequently resurrect a deleted blueprint.
export const createSaveQueue = (write: (snapshot: WorkspaceSnapshot) => Promise<void> = saveWorkspace) => {
  let tail = Promise.resolve()
  return (snapshot: WorkspaceSnapshot): Promise<void> => {
    const pending = tail.then(() => write(snapshot))
    tail = pending.catch(() => undefined)
    return pending
  }
}
