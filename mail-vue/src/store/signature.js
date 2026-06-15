import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '@/db/db.js'

export const useSignatureStore = defineStore('signature', () => {
    const signatures = ref([])
    const loaded = ref(false)

    async function loadSignatures() {
        try {
            signatures.value = await db.value.signature?.toArray() || []
            loaded.value = true
        } catch (e) {
            signatures.value = []
        }
    }

    async function addSignature(name, content) {
        const sigId = await db.value.signature.add({ name, content, isDefault: signatures.value.length === 0 ? 1 : 0 })
        await loadSignatures()
        return sigId
    }

    async function deleteSignature(sigId) {
        const sig = signatures.value.find(s => s.sigId === sigId)
        await db.value.signature.delete(sigId)
        if (sig?.isDefault) {
            const remaining = await db.value.signature.toArray()
            if (remaining.length > 0) {
                await db.value.signature.update(remaining[0].sigId, { isDefault: 1 })
            }
        }
        await loadSignatures()
    }

    async function setDefault(sigId) {
        await db.value.signature.toCollection().modify({ isDefault: 0 })
        await db.value.signature.update(sigId, { isDefault: 1 })
        await loadSignatures()
    }

    async function updateSignature(sigId, name, content) {
        await db.value.signature.update(sigId, { name, content })
        await loadSignatures()
    }

    function getDefault() {
        return signatures.value.find(s => s.isDefault === 1) || null
    }

    function exportForStandalone() {
        return signatures.value.map(s => ({ sigId: s.sigId, name: s.name, content: s.content, isDefault: s.isDefault }))
    }

    return { signatures, loaded, loadSignatures, addSignature, deleteSignature, setDefault, updateSignature, getDefault, exportForStandalone }
})
