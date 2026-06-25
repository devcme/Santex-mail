<template>
  <emailScroll ref="scroll"
               :allow-star="false"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
                @jump="jumpContent"
                @dblclick="openDraftWindow"
                actionLeft="6px"
               :show-account-icon="false"
               :show-first-loading="false"
               :showStar="false"
               @delete-draft="deleteDraft"
               :type="'draft'"
  >
    <template #name="props">
      <span class="send-email">{{ props.email.receiveEmail?.join(',') || '(' + $t('noRecipient') + ')' }}</span>
    </template>
    <template #subject="props">
      {{ props.email.subject || '(' + $t('noSubject') + ')' }}
    </template>
  </emailScroll>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, ref, watch, toRaw} from "vue";
import {useUiStore} from "@/store/ui.js";
import {userDraftStore} from "@/store/draft.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import db from "@/db/db.js"

defineOptions({
  name: 'draft'
})

const draftStore = userDraftStore();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const scroll = ref({})

watch(() => draftStore.setDraft, async () => {

  const draft = toRaw(draftStore.setDraft)
  const draftId = draft.draftId
  const attachments = toRaw(draftStore.setDraft.attachments)

  delete draft.draftId
  delete draft.attachments

  if (!draft.content && !draft.subject && !(draft.receiveEmail.length > 0)) {
    await db.value.draft.delete(draftId);
    await db.value.att.delete(draftId);
    draftStore.refreshList++
    return;
  }

  await db.value.draft.update(draftId, draft);
  await db.value.att.update(draftId, {attachments: attachments});
  draftStore.refreshList++
}, {
  deep: true
})

watch(() => draftStore.refreshList, async () => {
  const {list} = await getEmailList();
    scroll.value.emailList.length = 0
    scroll.value.handleList(list);
    scroll.value.emailList.push(...list)
})

function getEmailList() {
  return new Promise((resolve, reject) => {
    db.value.draft.orderBy('createTime').reverse().toArray().then(list => {
      resolve({list})
    })
  })
}

async function deleteDraft(draftIds) {
  await db.value.draft.bulkDelete(draftIds);
  draftStore.refreshList++
}

async function jumpContent(email) {
  const att = await db.value.att.get(email.draftId)
  email.attachments = att?.attachments || []
  uiStore.writerRef.openDraft(email);
}

async function openDraftWindow(email) {
  const att = await db.value.att.get(email.draftId)
  email.attachments = att?.attachments || []
  const account = accountStore.currentAccount
  const user = userStore.user
  const preload = JSON.parse(JSON.stringify(email))
  preload._sendEmail = account?.email || user?.email || ''
  preload._accountId = account?.accountId || user?.account?.accountId || -1
  preload._name = account?.name || user?.name || ''
  localStorage.setItem('compose-data', JSON.stringify({
    composeMode: 'draft',
    email: preload
  }))
  const url = `${window.location.origin}/compose`
  const win = window.open(url, '_blank', 'width=900,height=750')
  if (win) win.focus()
}

</script>
<style>
.send-email {
  font-weight: normal;
}
</style>
