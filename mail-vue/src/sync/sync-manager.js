import { useSyncStore } from '@/store/sync.js'
import { processOutbox, updatePendingCount } from './outbox.js'
import { cacheSingleEmail } from './email-cache.js'
import { isPWA } from '@/utils/notify.js'

let initialized = false
let onlineHandler = null
let offlineHandler = null
let periodicSyncTimer = null
const PERIODIC_SYNC_INTERVAL = 60 * 1000

export function initSyncManager() {
    if (initialized) return
    if (!isPWA()) return

    const syncStore = useSyncStore()

    onlineHandler = () => {
        syncStore.setOnline(true)
        syncStore.setSyncError(null)
        onReconnect()
    }

    offlineHandler = () => {
        syncStore.setOnline(false)
    }

    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)

    syncStore.setOnline(navigator.onLine)

    updatePendingCount()

    if (navigator.onLine) {
        setTimeout(() => onReconnect(), 1000)
    }

    periodicSyncTimer = setInterval(() => {
        if (navigator.onLine) {
            processOutbox()
        }
    }, PERIODIC_SYNC_INTERVAL)

    initialized = true
    console.log('[sync-manager] Initialized for PWA mode')
}

export function destroySyncManager() {
    if (onlineHandler) window.removeEventListener('online', onlineHandler)
    if (offlineHandler) window.removeEventListener('offline', offlineHandler)
    if (periodicSyncTimer) clearInterval(periodicSyncTimer)
    periodicSyncTimer = null
    initialized = false
}

async function onReconnect() {
    const syncStore = useSyncStore()
    syncStore.setSyncing(true)

    try {
        await processOutbox()
        syncStore.setLastSyncTime(Date.now())
    } catch (e) {
        syncStore.setSyncError(e?.message || 'Sync failed')
    } finally {
        syncStore.setSyncing(false)
    }
}

export async function cacheNewEmails(emails) {
    if (!isPWA() || !Array.isArray(emails)) return
    for (const email of emails) {
        await cacheSingleEmail(email)
    }
}

export function isOfflineMode() {
    return isPWA() && !navigator.onLine
}

export function isSyncEnabled() {
    return isPWA()
}
