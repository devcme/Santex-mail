<template>
  <div class="email-split" :class="{ 'has-detail': selectedEmail, 'is-resizing': isResizing }">
    <div class="email-list-panel" :style="selectedEmail ? { width: panelWidth + 'px', flexShrink: 0 } : {}">
      <emailScroll type="star" ref="scroll"
                  :allow-star="false"
                  :cancel-success="cancelStar"
                  :getEmailList="starList"
                  :emailDelete="emailDelete"
                  :star-add="starAdd"
                  :star-cancel="starCancel"
                  @jump="onJump"
                  @dblclick="onDblClick"
                  actionLeft="6px"
                  :show-account-icon="false"
      />
    </div>
    <div class="resize-handle" v-if="selectedEmail"
      @mousedown="startResize"
      @touchstart="handleTouchStart"
      @dblclick.stop="closeDetail"
    >
      <div class="resize-line"></div>
    </div>
    <div class="email-detail-panel" v-if="selectedEmail">
      <EmailDetail
        :email="selectedEmail"
        :show-star="true"
        :show-reply="true"
        :show-delete="false"
        @close="closeDetail"
        @reply="openReply"
        @forward="openForward"
        @star-change="onStarChange"
      />
    </div>
  </div>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import EmailDetail from "@/components/email-detail/index.vue"
import {emailDelete} from "@/request/email.js";
import {starAdd, starCancel, starList} from "@/request/star.js";
import {useEmailStore} from "@/store/email.js";
import {defineOptions, onMounted, ref} from "vue";
import {useUiStore} from "@/store/ui.js";
import { useSplitPane } from '@/utils/useSplitPane.js'

defineOptions({ name: 'star' })

const scroll = ref({})
const emailStore = useEmailStore();
const uiStore = useUiStore();

const {
  selectedEmail, panelWidth, isResizing,
  setEmail, closeDetail, dblClickContent,
  startResize, handleTouchStart
} = useSplitPane()

function onJump(email) {
  setEmail(email, { delType: 'logic', showStar: true, showReply: true, showUnread: true })
}

function onDblClick(email) {
  dblClickContent(email, { delType: 'logic', showStar: true, showReply: true, showUnread: true })
}

function openReply(email) { uiStore.writerRef.openReply(email) }
function openForward(email) { uiStore.writerRef.openForward(email) }

function cancelStar(email) {
  emailStore.cancelStarEmailId = email.emailId
  scroll.value.deleteEmail([email.emailId])
  if (selectedEmail.value?.emailId === email.emailId) closeDetail()
}

function onStarChange(email) {
  if (email.isStar) {
    emailStore.starScroll?.addItem(email)
  } else {
    emailStore.cancelStarEmailId = email.emailId
    scroll.value.deleteEmail([email.emailId])
    if (selectedEmail.value?.emailId === email.emailId) closeDetail()
  }
}

onMounted(() => { emailStore.starScroll = scroll })
</script>
<style scoped lang="scss">
.email-split {
  display: flex;
  height: 100%;
  overflow: hidden;

  &.has-detail {
    .email-list-panel {
      @media (max-width: 1023px) { display: none; }
    }
  }

  &.is-resizing { * { pointer-events: none; } }

  .email-list-panel {
    flex: 1;
    min-width: 300px;
    overflow: hidden;
  }

  .resize-handle {
    width: 6px;
    cursor: col-resize;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover .resize-line, &:active .resize-line { background: var(--el-color-primary); width: 3px; }
    .resize-line { width: 1px; height: 100%; background: var(--el-border-color); transition: all 0.15s ease; }
  }

  .email-detail-panel { flex: 1; min-width: 280px; overflow: hidden; background: var(--el-bg-color); }
}
</style>
