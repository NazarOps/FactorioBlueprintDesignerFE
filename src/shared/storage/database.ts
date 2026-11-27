const DATABASE_NAME = 'factorio-blueprint-designer'
const DATABASE_VERSION = 1
export const WORKSPACE_STORE = 'workspace'

export const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(WORKSPACE_STORE)) {
      request.result.createObjectStore(WORKSPACE_STORE)
    }
  }
  request.onsuccess = () => {
    const database = request.result
    database.onversionchange = () => database.close()
    resolve(database)
  }
  request.onerror = () => reject(request.error ?? new Error('Could not open browser storage.'))
  request.onblocked = () => reject(new Error('Storage upgrade is blocked. Close other editor tabs and retry.'))
})
