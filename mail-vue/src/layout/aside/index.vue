<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="compose-btn" :class="{ 'compose-collapsed': !uiStore.asideShow }" @click="openCompose" @dblclick.stop="openComposeNewWindow">
        <Icon icon="material-symbols:edit-outline-sharp" width="22" height="22" />
        <span class="compose-text" v-show="uiStore.asideShow">{{ settingStore.settings.title }}</span>
      </div>
      <div class="menu-list">
        <template v-for="item in menuItems" :key="item.index">
          <div v-if="item.index === '_divider_'" class="menu-divider">
            <span class="divider-text" v-show="uiStore.asideShow">{{ t('manage') }}</span>
          </div>
          <div v-else
               class="menu-item" :class="{ 'menu-active': route.meta.name === item.index }"
               @click="router.push({name: item.index})">
            <el-tooltip v-if="!uiStore.asideShow" :content="item.label" placement="right" :show-after="300">
              <div class="menu-icon"><Icon :icon="item.icon" :width="item.iconSize || '20'" :height="item.iconSize || '20'" /></div>
            </el-tooltip>
            <template v-else>
              <div class="menu-icon"><Icon :icon="item.icon" :width="item.iconSize || '20'" :height="item.iconSize || '20'" /></div>
              <span class="menu-text">{{ item.label }}</span>
            </template>
          </div>
        </template>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useSettingStore } from "@/store/setting.js";
import { useUiStore } from "@/store/ui.js";
import { useEmailStore } from "@/store/email.js";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { hasPerm } from "@/perm/perm.js";

const settingStore = useSettingStore();
const uiStore = useUiStore();
const emailStore = useEmailStore();
const route = useRoute();
const { t } = useI18n();

function openCompose() {
  emailStore.contentData.composeMode = 'new'
  emailStore.contentData.email = {}
  uiStore.writerRef.open()
}

function openComposeNewWindow() {
  emailStore.contentData.composeMode = 'new'
  emailStore.contentData.email = {}
  localStorage.setItem('compose-data', JSON.stringify({
    composeMode: 'new',
    email: {}
  }))
  const url = `${window.location.origin}/compose`
  const win = window.open(url, '_blank', 'width=900,height=750')
  if (win) win.focus()
}

const allMenuItems = computed(() => [
  { index: 'email', label: t('inbox'), icon: 'hugeicons:mailbox-01', perm: null },
  { index: 'send', label: t('sent'), icon: 'cil:send', perm: 'email:send' },
  { index: 'draft', label: t('drafts'), icon: 'ep:document', perm: 'email:send' },
  { index: 'star', label: t('starred'), icon: 'solar:star-line-duotone', perm: null },
  { index: 'setting', label: t('settings'), icon: 'fluent:settings-48-regular', perm: null },
  { index: '_divider_', label: '', icon: '', perm: 'any:manage' },
  { index: 'analysis', label: t('analytics'), icon: 'fluent:data-pie-20-regular', perm: 'analysis:query' },
  { index: 'user', label: t('allUsers'), icon: 'si:user-alt-2-line', perm: 'user:query' },
  { index: 'all-email', label: t('allMail'), icon: 'fluent:mail-list-28-regular', perm: 'all-email:query' },
  { index: 'role', label: t('permissions'), icon: 'fluent:lock-closed-16-regular', perm: 'role:query' },
  { index: 'reg-key', label: t('inviteCode'), icon: 'fluent:fingerprint-20-filled', perm: 'reg-key:query' },
  { index: 'sys-setting', label: t('SystemSettings'), icon: 'eos-icons:system-ok-outlined', perm: 'setting:query' },
])

const managePerms = ['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']

const menuItems = computed(() => {
  return allMenuItems.value.filter(item => {
    if (item.index === '_divider_') {
      return managePerms.some(p => hasPerm(p))
    }
    if (!item.perm) return true
    return hasPerm(item.perm)
  })
})
</script>

<style lang="scss" scoped>
.compose-btn {
  margin: 15px 16px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  padding: 0 12px;
  white-space: nowrap;
  overflow: hidden;

  .compose-text {
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.2s ease;
  }
}

.compose-collapsed {
  margin: 15px auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 10px;

  .compose-text {
    display: none;
  }
}

.menu-list {
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  margin: 2px 8px;
  padding: 0 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s ease;
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  .menu-text {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.menu-active {
  font-weight: bold;
  background: rgba(255, 255, 255, 0.08);
}

.menu-divider {
  margin: 8px 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);

  .divider-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.scroll {
  height: 100%;
  background: var(--aside-backgound);
}
</style>
