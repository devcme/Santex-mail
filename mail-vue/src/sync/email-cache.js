import db from '@/db/db.js'

const META_PREFIX = 'meta_'

export async function cacheEmailList(data, { type, accountId, allReceive }) {
    if (!db.value?.emailCache) return
    try {
        const emails = (data.list || []).map(e => ({ ...e }))
        if (emails.length === 0 && !data.latestEmail) return

        await db.value.transaction('rw', db.value.emailCache, db.value.syncMeta, async () => {
            if (emails.length > 0) {
                await db.value.emailCache.bulkPut(emails)
            }

            const metaKey = buildMetaKey(type, accountId, allReceive)
            const latestEmail = data.latestEmail ? stripViewFields(data.latestEmail) : null
            await db.value.syncMeta.put({
                key: metaKey,
                total: data.total ?? 0,
                latestEmail,
                cachedAt: Date.now()
            })
        })
    } catch (e) {
        console.error('[email-cache] cacheEmailList error:', e)
    }
}

export async function cacheSingleEmail(email) {
    if (!db.value?.emailCache || !email?.emailId) return
    try {
        await db.value.emailCache.put({ ...email })
    } catch (e) {
        console.error('[email-cache] cacheSingleEmail error:', e)
    }
}

export async function getCachedEmailList({ type, accountId, emailId, size, timeSort, search, allReceive }) {
    if (!db.value?.emailCache) return { list: [], total: 0, latestEmail: null }

    try {
        let results

        if (type === 'all') {
            let coll = db.value.emailCache.orderBy('emailId')
            if (emailId > 0) {
                coll = coll.and(e => e.emailId < emailId)
            }
            results = await coll.reverse().limit(size).toArray()
        } else {
            let coll = db.value.emailCache
                .where('[type+accountId]')
                .equals([type, accountId])

            if (emailId > 0) {
                coll = coll.and(e => e.emailId < emailId)
            }
            results = await coll.reverse().limit(size).toArray()
        }

        if (timeSort === 1) {
            results.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        }

        if (search) {
            if (search.name) {
                const kw = search.name.toLowerCase()
                results = results.filter(e =>
                    (e.name && e.name.toLowerCase().includes(kw)) ||
                    (e.sendEmail && e.sendEmail.toLowerCase().includes(kw)) ||
                    (e.toEmail && e.toEmail.toLowerCase().includes(kw))
                )
            }
            if (search.subject) {
                const kw = search.subject.toLowerCase()
                results = results.filter(e => e.subject && e.subject.toLowerCase().includes(kw))
            }
        }

        const meta = await getSyncMeta(buildMetaKey(type, accountId, allReceive))

        return {
            list: results,
            total: meta?.total || results.length,
            latestEmail: meta?.latestEmail || null
        }
    } catch (e) {
        console.error('[email-cache] getCachedEmailList error:', e)
        return { list: [], total: 0, latestEmail: null }
    }
}

export async function getCachedEmail(emailId) {
    if (!db.value?.emailCache) return null
    try {
        return await db.value.emailCache.get(emailId)
    } catch (e) {
        console.error('[email-cache] getCachedEmail error:', e)
        return null
    }
}

export async function markEmailsReadInCache(emailIds) {
    if (!db.value?.emailCache) return
    try {
        await db.value.transaction('rw', db.value.emailCache, async () => {
            for (const id of emailIds) {
                const email = await db.value.emailCache.get(id)
                if (email) {
                    email.unread = 0
                    await db.value.emailCache.put(email)
                }
            }
        })
    } catch (e) {
        console.error('[email-cache] markEmailsReadInCache error:', e)
    }
}

export async function markEmailsDeletedInCache(emailIds) {
    if (!db.value?.emailCache) return
    try {
        await db.value.transaction('rw', db.value.emailCache, async () => {
            for (const id of emailIds) {
                const email = await db.value.emailCache.get(id)
                if (email) {
                    email.isDel = 1
                    await db.value.emailCache.put(email)
                }
            }
        })
    } catch (e) {
        console.error('[email-cache] markEmailsDeletedInCache error:', e)
    }
}

export async function hardDeleteEmailsFromCache(emailIds) {
    if (!db.value?.emailCache) return
    try {
        await db.value.emailCache.bulkDelete(emailIds)
    } catch (e) {
        console.error('[email-cache] hardDeleteEmailsFromCache error:', e)
    }
}

export async function getSyncMeta(key) {
    if (!db.value?.syncMeta) return null
    try {
        return await db.value.syncMeta.get(key)
    } catch (e) {
        return null
    }
}

export async function setSyncMeta(key, value) {
    if (!db.value?.syncMeta) return
    try {
        await db.value.syncMeta.put({ key, ...value })
    } catch (e) {
        console.error('[email-cache] setSyncMeta error:', e)
    }
}

export async function clearEmailCache() {
    if (!db.value?.emailCache) return
    try {
        await db.value.emailCache.clear()
        await db.value.syncMeta.clear()
    } catch (e) {
        console.error('[email-cache] clearEmailCache error:', e)
    }
}

export async function getCachedEmailCount() {
    if (!db.value?.emailCache) return 0
    try {
        return await db.value.emailCache.count()
    } catch (e) {
        return 0
    }
}

function buildMetaKey(type, accountId, allReceive) {
    return `${META_PREFIX}${type}_${accountId}_${allReceive ? 1 : 0}`
}

function stripViewFields(email) {
    const { reqAccountId, allReceive, ...rest } = email
    return rest
}
