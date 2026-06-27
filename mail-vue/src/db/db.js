import Dexie from "dexie";
import {useUserStore} from "@/store/user.js"
import { watch, shallowRef } from "vue";

const userStore = useUserStore();


let db =  shallowRef({})

function createDB() {
    db.value = new Dexie(userStore.user.email);
    db.value.version(1).stores({
        draft: '++draftId,createTime',
        att: 'draftId'
    })
    db.value.version(2).stores({
        draft: '++draftId,createTime',
        att: 'draftId',
        signature: '++sigId, isDefault'
    })
    db.value.version(3).stores({
        draft: '++draftId,createTime',
        att: 'draftId',
        signature: '++sigId, isDefault',
        emailCache: 'emailId, type, accountId, [type+accountId], createTime, unread, isDel',
        outbox: '++id, operation, status, createdAt',
        syncMeta: 'key'
    })
}

createDB()

watch(() => userStore.user.email,() => createDB())

export default db;