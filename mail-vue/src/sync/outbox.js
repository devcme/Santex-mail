import db from '@/db/db.js'
import { emailDelete, emailRead, emailSend } from '@/request/email.js'
import { allEmailDelete } from '@/request/all-email.js'
import { starAdd, starCancel } from '@/request/star.js'
import { markEmailsReadInCache, markEmailsDeletedInCache, hardDeleteEmailsFromCache } from './email-cache.js'
import { useSyncStore } from '@/store/sync.js'

const MAX_RETRIES = 5

export async function addToOutbox(operation, payload) {
    if (!db.value?.outbox) return
    try {
        const id = await db.value.outbox.add({
            operation,
            payload: JSON.stringify(payload),
            status: 'pending',
            retries: 0,
            createdAt: Date.now(),
            error: null
        })
        updatePendingCount()
        return id
    } catch (e) {
        console.error('[outbox] addToOutbox error:', e)
    }
}

export async function getOutboxCount() {
    if (!db.value?.outbox) return 0
    try {
        return await db.value.outbox.where('status').equals('pending').count()
    } catch (e) {
        return 0
    }
}

export async function updatePendingCount() {
    const syncStore = useSyncStore()
    syncStore.setPendingCount(await getOutboxCount())
}

export async function processOutbox() {
    if (!db.value?.outbox) return
    if (!navigator.onLine) return

    const syncStore = useSyncStore()
    let pending
    try {
        pending = await db.value.outbox.where('status').equals('pending').toArray()
    } catch (e) {
        console.error('[outbox] processOutbox query error:', e)
        return
    }

    if (pending.length === 0) {
        syncStore.setPendingCount(0)
        return
    }

    syncStore.setSyncing(true)

    for (const item of pending) {
        try {
            await executeOutboxItem(item)
            await db.value.outbox.delete(item.id)
        } catch (e) {
            console.error(`[outbox] ${item.operation} failed:`, e)
            const retries = (item.retries || 0) + 1
            if (retries >= MAX_RETRIES) {
                await db.value.outbox.update(item.id, {
                    status: 'failed',
                    retries,
                    error: e?.message || String(e)
                })
            } else {
                await db.value.outbox.update(item.id, {
                    retries,
                    error: e?.message || String(e)
                })
            }
        }
    }

    await updatePendingCount()
    syncStore.setSyncing(false)
    syncStore.setLastSyncTime(Date.now())
}

async function executeOutboxItem(item) {
    const payload = JSON.parse(item.payload)

    switch (item.operation) {
        case 'emailDelete':
            await emailDelete(payload.emailIds)
            break
        case 'emailRead':
            await emailRead(payload.emailIds)
            break
        case 'emailSend':
            await emailSend(payload.form, () => {})
            break
        case 'allEmailDelete':
            await allEmailDelete(payload.emailIds)
            break
        case 'starAdd':
            await starAdd(payload.emailId)
            break
        case 'starCancel':
            await starCancel(payload.emailId)
            break
        default:
            console.warn('[outbox] Unknown operation:', item.operation)
    }
}

export async function offlineEmailDelete(emailIds) {
    const ids = Array.isArray(emailIds) ? emailIds : [emailIds]
    await markEmailsDeletedInCache(ids)
    await addToOutbox('emailDelete', { emailIds: ids.join(',') })
}

export async function offlineEmailRead(emailIds) {
    const ids = Array.isArray(emailIds) ? emailIds : [emailIds]
    await markEmailsReadInCache(ids)
    await addToOutbox('emailRead', { emailIds })
}

export async function offlineStarAdd(emailId) {
    await addToOutbox('starAdd', { emailId })
}

export async function offlineStarCancel(emailId) {
    await addToOutbox('starCancel', { emailId })
}

export async function offlineAllEmailDelete(emailIds) {
    const ids = Array.isArray(emailIds) ? emailIds : [emailIds]
    await markEmailsDeletedInCache(ids)
    await addToOutbox('allEmailDelete', { emailIds: ids.join(',') })
}
