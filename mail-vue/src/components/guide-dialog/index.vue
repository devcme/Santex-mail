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
    </div>
    <template #footer>
      <el-checkbox v-model="dontShow">{{ $t('guideDontShow') }}</el-checkbox>
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
const dontShow = ref(false)

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
])

function open() {
  show.value = true
}

function close() {
  show.value = false
  if (dontShow.value) {
    localStorage.setItem('guide-shown', '1')
  }
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
}
</style>
