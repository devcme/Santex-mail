<template>
  <el-dialog v-model="show" :title="$t('guideTitle')" width="600" class="guide-dialog" :close-on-click-modal="false">
    <div class="guide-content">
      <div class="guide-item" v-for="(item, i) in guideItems" :key="i">
        <div class="guide-icon-wrap">
          <Icon v-for="(icon, j) in item.icons" :key="j" :icon="icon" :width="item.iconSize || '22'" :height="item.iconSize || '22'" class="guide-icon"/>
        </div>
        <div class="guide-text">
          <div class="guide-label">{{ item.label }}</div>
          <div class="guide-desc">{{ item.desc }}</div>
        </div>
      </div>
      <div class="guide-scroll-hint">{{ $t('guideScrollHint') }}</div>
    </div>
    <template #footer>
      <el-button type="primary" @click="close">{{ $t('gotIt') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n()
const show = ref(false)

const guideItems = computed(() => [
  {
    icons: ['material-symbols:edit-outline-sharp'],
    label: t('guideWriteEmail'),
    desc: t('guideWriteEmailDesc')
  },
  {
    icons: ['mingcute:menu-fill'],
    label: t('guideSidebar'),
    desc: t('guideSidebarDesc')
  },
  {
    icons: ['mdi:cursor-default-click-outline'],
    label: t('guideDblClick'),
    desc: t('guideDblClickDesc')
  },
  {
    icons: ['mdi:view-list-outline', 'mdi:view-agenda-outline'],
    label: t('guideCompact'),
    desc: t('guideCompactDesc')
  },
  {
    icons: ['la:reply', 'la:reply-all', 'iconoir:arrow-up-right'],
    label: t('guideReplyFwd'),
    desc: t('guideReplyFwdDesc')
  },
  {
    icons: ['solar:star-line-duotone'],
    label: t('guideStar'),
    desc: t('guideStarDesc')
  },
  {
    icons: ['material-symbols-light:close-rounded'],
    label: t('guideClose'),
    desc: t('guideCloseDesc')
  },
  {
    icons: ['mdi:theme-light-dark', 'material-symbols:zoom-in-rounded', 'material-symbols:zoom-out-rounded'],
    iconSize: '18',
    label: t('guideBgZoom'),
    desc: t('guideBgZoomDesc')
  },
  {
    icons: ['iconamoon:attachment-fill'],
    label: t('guideAttachment'),
    desc: t('guideAttachmentDesc')
  },
  {
    icons: ['mdi:draw-pen'],
    label: t('guideSignature'),
    desc: t('guideSignatureDesc')
  },
  {
    icons: ['material-symbols-light:timer-arrow-down-outline'],
    label: t('guideSort'),
    desc: t('guideSortDesc')
  },
  {
    icons: ['mingcute:notification-line'],
    label: t('guideNotify'),
    desc: t('guideNotifyDesc')
  },
  {
    icons: ['ion:reload'],
    label: t('guideRefresh'),
    desc: t('guideRefreshDesc')
  },
])

function open() {
  show.value = true
}

function close() {
  show.value = false
}

defineExpose({ open, show })
</script>

<style scoped lang="scss">
.guide-content {
  max-height: 60vh;
  overflow-y: auto;
}

.guide-item {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  &:last-child { border-bottom: none; }
}

.guide-icon-wrap {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  width: 80px;
  justify-content: center;
  padding-top: 2px;
}

.guide-icon {
  color: var(--el-color-primary);
}

.guide-text {
  flex: 1;
  min-width: 0;
}

.guide-label {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.guide-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  white-space: pre-line;
}

.guide-scroll-hint {
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  padding: 14px 0 4px;
}
</style>
