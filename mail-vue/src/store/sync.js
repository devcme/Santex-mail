import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isPWA } from '@/utils/notify.js'

export const useSyncStore = defineStore('sync', () => {
    const online = ref(navigator.onLine)
    const syncing = ref(false)
    const lastSyncTime = ref(0)
    const pendingCount = ref(0)
    const syncError = ref(null)
    const pwaMode = ref(isPWA())
    const enabled = ref(isPWA())

    const status = computed(() => {
        if (!enabled.value) return 'disabled'
        if (!online.value) return 'offline'
        if (syncing.value) return 'syncing'
        if (syncError.value) return 'error'
        if (pendingCount.value > 0) return 'pending'
        return 'synced'
    })

    const statusText = computed(() => {
        switch (status.value) {
            case 'disabled': return 'syncDisabled'
            case 'offline': return 'offlineMode'
            case 'syncing': return 'syncing'
            case 'error': return 'syncFailed'
            case 'pending': return 'syncPending'
            case 'synced': return 'synced'
            default: return ''
        }
    })

    function setOnline(val) {
        online.value = val
        if (val) syncError.value = null
    }

    function setSyncing(val) {
        syncing.value = val
    }

    function setSyncError(err) {
        syncError.value = err
    }

    function setLastSyncTime(time) {
        lastSyncTime.value = time
    }

    function setPendingCount(count) {
        pendingCount.value = count
    }

    return {
        online, syncing, lastSyncTime, pendingCount, syncError, pwaMode, enabled,
        status, statusText,
        setOnline, setSyncing, setSyncError, setLastSyncTime, setPendingCount
    }
})
