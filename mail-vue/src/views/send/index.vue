<template>
  <div class="email-split" :class="{ 'has-detail': selectedEmail, 'is-resizing': isResizing, 'narrow-view': isNarrow, 'fullscreen-detail': isFullScreenDetail }">
    <div class="email-list-panel" :style="selectedEmail ? { width: panelWidth + 'px', flex: 'none' } : {}">
      <emailScroll ref="sendScroll"
                  :cancel-success="cancelStar"
                  :star-success="addStar"
                  :getEmailList="getEmailList"
                  :emailDelete="emailDelete"
                  :star-add="starAdd"
                  show-status
                   actionLeft="4px"
                   :split-active="!!selectedEmail"
                   :compact="compactMode"
                   :star-cancel="starCancel"
                   @jump="onJump"
                   @dblclick="onDblClick"
                   :time-sort="params.timeSort"
                   :type="'send'"
      >
        <template #first>
          <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
                v-if="params.timeSort === 0" width="28" height="28"/>
          <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
                width="28" height="28"/>
          <Icon class="icon" :class="{ 'icon-active': compactMode }" @click="toggleCompact"
                :icon="compactMode ? 'material-symbols:view-agenda-rounded' : 'material-symbols:view-stream-rounded'" width="22" height="22"/>
          <el-popover placement="bottom" :width="320" trigger="click" v-model:visible="searchPopoverShow">
            <template #reference>
              <Icon class="icon" icon="iconoir:search" width="20" height="20"/>
            </template>
            <div class="search-popover">
              <div class="search-popover-title">{{ $t('search') }}</div>
              <el-select v-model="searchParams.searchType" :placeholder="$t('select')" style="width: 100%; margin-bottom: 8px;">
                <el-option :label="$t('recipient')" value="name"/>
                <el-option :label="$t('subject')" value="subject"/>
              </el-select>
              <el-input v-model="searchParams.keyword" :placeholder="$t('searchByContent')" @keyup.enter="doSearch" style="margin-bottom: 8px;"/>
              <div class="search-popover-actions">
                <el-button size="small" @click="clearSearch">{{ $t('cancel') }}</el-button>
                <el-button size="small" type="primary" @click="doSearch">{{ $t('search') }}</el-button>
              </div>
            </div>
          </el-popover>
        </template>
      </emailScroll>
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
        @replyAll="openReplyAll"
        @forward="openForward"
        @star-change="onStarChange"
      />
    </div>
  </div>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import emailScroll from "@/components/email-scroll/index.vue"
import EmailDetail from "@/components/email-detail/index.vue"
import {emailList, emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, onMounted, reactive, ref, watch, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import { useSplitPane } from '@/utils/useSplitPane.js'

defineOptions({ name: 'send' })

const emailStore = useEmailStore();
const accountStore = useAccountStore();
const uiStore = useUiStore();
const sendScroll = ref({})
const params = reactive({ timeSort: 0 })

const {
  selectedEmail, panelWidth, isResizing, isNarrow, isFullScreenDetail,
  setEmail, closeDetail, dblClickContent,
  startResize, handleTouchStart
} = useSplitPane()

const compactOverride = ref(false)
const compactMode = computed(() => isNarrow.value || compactOverride.value)

function toggleCompact() {
  if (isNarrow.value) return
  compactOverride.value = !compactOverride.value
}
const searchPopoverShow = ref(false)
const searchParams = reactive({ searchType: 'name', keyword: '' })
const activeSearchParams = ref(null)

onMounted(() => {
  emailStore.sendScroll = sendScroll;
})

watch(() => accountStore.currentAccountId, () => {
  closeDetail()
  sendScroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  sendScroll.value.refreshList();
}

function onJump(email) {
  setEmail(email, { delType: 'logic', showStar: true, showReply: true, showUnread: true })
}

function onDblClick(email) {
  dblClickContent(email, { delType: 'logic', showStar: true, showReply: true, showUnread: true })
}

function openReply(email) { uiStore.writerRef.openReply(email) }
function openReplyAll(email) { uiStore.writerRef.openReplyAll(email) }
function openForward(email) { uiStore.writerRef.openForward(email) }

function onStarChange(email) {
  if (email.isStar) {
    emailStore.starScroll?.addItem(email)
  } else {
    emailStore.starScroll?.deleteEmail([email.emailId])
  }
}

function addStar(email) { emailStore.starScroll?.addItem(email) }
function cancelStar(email) { emailStore.starScroll?.deleteEmail([email.emailId]) }

function getEmailList(emailId, size) {
  const accountId = accountStore.currentAccountId;
  const allReceive = accountStore.currentAccount.allReceive;
  const extra = activeSearchParams.value ? activeSearchParams.value : {}
  return emailList(accountId, allReceive, emailId, params.timeSort, size, 1, extra).then(data => {
    if (data.latestEmail) {
      data.latestEmail.reqAccountId = accountId;
      data.latestEmail.allReceive = allReceive;
    }
    return data;
  })
}

function doSearch() {
  if (!searchParams.keyword) {
    activeSearchParams.value = null
  } else {
    activeSearchParams.value = {}
    activeSearchParams.value[searchParams.searchType] = searchParams.keyword
  }
  sendScroll.value.refreshList()
  searchPopoverShow.value = false
}

function clearSearch() {
  searchParams.keyword = ''
  activeSearchParams.value = null
  sendScroll.value.refreshList()
  searchPopoverShow.value = false
}
</script>
<style scoped lang="scss">
.email-split {
  display: flex;
  height: 100%;
  overflow: hidden;

  &.has-detail {
    .email-list-panel {
    }
  }

  &.narrow-view.has-detail {
    .email-list-panel { /* compact mode active, keep visible */ }
  }

  &.fullscreen-detail {
    .email-list-panel { display: none !important; }
    .resize-handle { display: none !important; }
    .email-detail-panel { min-width: 0 !important; }
  }

  &.is-resizing { * { pointer-events: none; } }

  .email-list-panel {
    flex: 1;
    min-width: 400px;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  &.is-resizing .email-list-panel {
    transition: none;
  }

  .resize-handle {
    width: 8px;
    cursor: col-resize;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    &::after { content: ''; position: absolute; left: 0; right: 0; top: 0; bottom: 0; }
    &:hover .resize-line { background: var(--el-color-primary); width: 3px; }
    .resize-line { width: 1px; height: 100%; background: var(--el-border-color); transition: all 0.15s ease; }
  }

  .email-detail-panel { flex: 1; min-width: 280px; overflow: hidden; background: var(--el-bg-color); animation: slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.icon { cursor: pointer; }
.icon-active { color: var(--el-color-primary); }

.search-popover {
  .search-popover-title {
    font-weight: bold;
    margin-bottom: 10px;
  }
  .search-popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
