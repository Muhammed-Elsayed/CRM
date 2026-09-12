// IndexedDB read/write transactions serialize lease acquisition even on public HTTP,
// where Web Locks are unavailable. This store contains no credentials or tokens.
type Coordination = { owner: string | null; until: number; epoch: number; signedOut: boolean }
const leaseMilliseconds = 20_000
let database: Promise<IDBDatabase> | undefined

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('clientflow-auth', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('coordination')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Session coordination is unavailable. Please enable browser storage.'))
    request.onblocked = () => reject(new Error('Close older CRM tabs and try again.'))
  }).catch(error => {
    database = undefined
    throw error
  })
  return database
}

async function updateRecord(update: (record: Coordination) => Coordination) {
  const db = await openDatabase()
  return new Promise<Coordination>((resolve, reject) => {
    const tx = db.transaction('coordination', 'readwrite')
    const store = tx.objectStore('coordination')
    const request = store.get('session')
    let result: Coordination
    request.onsuccess = () => {
      const record: Coordination = request.result ?? { owner: null, until: 0, epoch: 0, signedOut: false }
      result = update(record)
      store.put(result, 'session')
    }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(new Error('Could not coordinate the browser session. Please retry.'))
    tx.onabort = () => reject(new Error('Browser session coordination was interrupted. Please retry.'))
  })
}

export type SessionLease = {
  epoch: number
  signedOut: boolean
  assertOwned: () => Promise<void>
  changeSession: (signedOut: boolean) => Promise<number>
}

export async function withSessionLease<T>(operation: (lease: SessionLease) => Promise<T>): Promise<T> {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const owner = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  const deadline = Date.now() + 30_000
  let record: Coordination
  do {
    record = await updateRecord(current => !current.owner || current.until <= Date.now()
      ? { ...current, owner, until: Date.now() + leaseMilliseconds }
      : current)
    if (record.owner === owner) break
    if (Date.now() >= deadline) throw new Error('Another tab is updating your session. Please retry.')
    await new Promise(resolve => setTimeout(resolve, 100))
  } while (record.owner !== owner)

  let lost = false
  const heartbeat = setInterval(() => {
    void updateRecord(current => {
      if (current.owner !== owner || current.until <= Date.now()) { lost = true; return current }
      return { ...current, until: Date.now() + leaseMilliseconds }
    }).catch(() => { lost = true })
  }, 5000)
  const assertOwned = async () => {
    const current = await updateRecord(current => current)
    if (lost || current.owner !== owner || current.until <= Date.now()) {
      throw new Error('Session coordination was interrupted. Please sign in again.')
    }
  }
  try {
    return await operation({
      epoch: record.epoch,
      signedOut: record.signedOut,
      assertOwned,
      changeSession: async (signedOut) => {
        await assertOwned()
        let changed = false
        const next = await updateRecord(current => {
          if (current.owner !== owner || current.until <= Date.now()) return current
          changed = true
          return { ...current, signedOut, epoch: current.epoch + 1 }
        })
        if (!changed) throw new Error('Session coordination was interrupted.')
        return next.epoch
      },
    })
  } finally {
    clearInterval(heartbeat)
    await updateRecord(current => current.owner === owner ? { ...current, owner: null, until: 0 } : current)
  }
}
