<template>
  <el-container class="layout">
    <el-aside
        class="aside"
        :class="uiStore.asideShow ? 'aside-show' : 'aside-narrow'"
        :width="uiStore.asideShow ? '176px' : '64px'">
      <Aside />
    </el-aside>
    <div
        :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>
    <el-container class="main-container">
      <el-main>
        <el-header>
            <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
  <GuideDialog ref="guideDialogRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import GuideDialog from '@/components/guide-dialog/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import writer from '@/layout/write/index.vue'
import db from '@/db/db.js'
import { userDraftStore } from '@/store/draft.js'
import { h } from 'vue'

const uiStore = useUiStore();
const draftStore = userDraftStore()
const writerRef = ref({})
const guideDialogRef = ref({})
const { t } = useI18n()
const isMobile = ref(window.innerWidth < 513)
const handleResize = () => {
  isMobile.value = window.innerWidth < 513
  if (isMobile.value) {
    uiStore.asideShow = false
  } else {
    uiStore.asideShow = !uiStore.asideCollapsed
  }
}

onMounted(() => {
  uiStore.writerRef = writerRef

  window.addEventListener('resize', handleResize)
  handleResize()

  window.addEventListener('message', handleMessage)

  if (!localStorage.getItem('guide-shown')) {
    setTimeout(() => guideDialogRef.value?.open(), 500)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('message', handleMessage)
})

function handleMessage(event) {
  if (event.origin !== window.location.origin) return
  if (event.data.type === 'compose-action') {
    checkComposeAction()
  } else if (event.data.type === 'save-draft' && event.data.draft) {
    saveDraftFromStandalone(event.data.draft)
  } else if (event.data.type === 'send-success') {
    ElNotification({
      title: t('sendSuccessMsg'),
      message: t('sendSuccessMsg'),
      position: 'bottom-right'
    })
  }
}

async function saveDraftFromStandalone(draftData) {
  try {
    if (draftData.draftId) {
      draftStore.setDraft = { ...draftData }
    } else if (db.value) {
      const fd = { ...draftData }
      delete fd.draftId
      delete fd.attachments
      const draftId = await db.value.draft.add({ ...fd })
      if (draftData.attachments?.length) {
        db.value.att.add({ draftId, attachments: draftData.attachments })
      }
      draftStore.refreshList++
    }
    ElNotification({
      title: t('saveSuccessMsg'),
      message: t('saveSuccessMsg'),
      position: 'bottom-right'
    })
  } catch (e) {
    console.error('Failed to save draft:', e)
  }
}

function checkComposeAction() {
  const raw = localStorage.getItem('compose-action')
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    localStorage.removeItem('compose-action')
    if (data.type === 'reply' && data.email) {
      uiStore.writerRef.openReply(data.email)
    } else if (data.type === 'replyAll' && data.email) {
      uiStore.writerRef.openReplyAll(data.email)
    } else if (data.type === 'forward' && data.email) {
      uiStore.writerRef.openForward(data.email)
    }
  } catch (e) {
    localStorage.removeItem('compose-action')
  }
}
</script>

<style lang="scss" scoped>
.aside-narrow {
  width: 64px !important;
  overflow: visible;
  transition: width 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;

  @media (max-width: 512px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: var(--el-bg-color);
    transform: translateX(-100%);
  }
}

.aside-show {
  width: 176px !important;
  -webkit-box-shadow: var(--aside-right-border);
  box-shadow: var(--aside-right-border);
  transition: width 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
  z-index: 101;

  @media (max-width: 512px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: var(--el-bg-color);
    transform: translateX(0);
  }
}

.aside {
  transition: width 0.3s ease, transform 0.3s ease;
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  background: var(--el-bg-color);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.el-main {
  padding: 0;
}

.el-header {
  background: var(--el-bg-color);
  border-bottom: solid 1px var(--el-border-color);
  padding: 0 0 0 0;
}

.overlay-show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  transition: all 0.3s;
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}
</style>
