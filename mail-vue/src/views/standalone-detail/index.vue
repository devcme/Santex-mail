<template>
  <div class="standalone-detail">
    <EmailDetail
      v-if="email"
      :email="email"
      :show-star="contentData.showStar ?? true"
      :show-reply="contentData.showReply ?? true"
      :show-unread="contentData.showUnread ?? false"
      :show-delete="false"
      :del-type="contentData.delType ?? 'logic'"
      @close="handleClose"
      @reply="handleReply"
      @forward="handleForward"
      @star-change="onStarChange"
    />
    <div v-else class="no-data">
      <el-empty :description="$t('noMessagesFound')" />
    </div>
  </div>
</template>

<script setup>
import EmailDetail from '@/components/email-detail/index.vue'
import { ref, onMounted } from 'vue'
import { useEmailStore } from '@/store/email.js'
import { useUiStore } from '@/store/ui.js'

const emailStore = useEmailStore()
const email = ref(null)
const contentData = ref({})

onMounted(() => {
  email.value = emailStore.contentData.email
  contentData.value = emailStore.contentData || {}
})

function handleClose() {
  window.close()
}

function handleReply(emailData) {
  localStorage.setItem('compose-action', JSON.stringify({
    type: 'reply',
    email: JSON.parse(JSON.stringify(emailData))
  }))
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'compose-action' }, window.location.origin)
  }
  window.close()
}

function handleForward(emailData) {
  localStorage.setItem('compose-action', JSON.stringify({
    type: 'forward',
    email: JSON.parse(JSON.stringify(emailData))
  }))
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'compose-action' }, window.location.origin)
  }
  window.close()
}

function onStarChange() {}
</script>

<style scoped lang="scss">
.standalone-detail {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--el-bg-color);
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
