<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title" :class="{ 'title-collapsed': !uiStore.asideShow }" @click="openCompose">
        <Icon icon="material-symbols:edit-outline-sharp" width="22" height="22" />
        <transition name="fade-text">
          <div v-show="uiStore.asideShow">{{ settingStore.settings.title }}</div>
        </transition>
      </div>
      <el-menu :collapse="!uiStore.asideShow" text-color="#fff" active-text-color="#fff" style="margin-top: 10px" @select="handleMenuSelect">
        <el-menu-item index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <template #title><span class="menu-name">{{ $t('inbox') }}</span></template>
        </el-menu-item>
        <el-menu-item index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <template #title><span class="menu-name">{{ $t('sent') }}</span></template>
        </el-menu-item>
        <el-menu-item index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <template #title><span class="menu-name">{{ $t('drafts') }}</span></template>
        </el-menu-item>
        <el-menu-item index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <template #title><span class="menu-name">{{ $t('starred') }}</span></template>
        </el-menu-item>
        <el-menu-item index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <template #title><span class="menu-name">{{ $t('settings') }}</span></template>
        </el-menu-item>
        <transition name="fade-text">
          <div class="manage-title" v-if="uiStore.asideShow" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
            <div>{{ $t('manage') }}</div>
          </div>
          <div class="manage-divider" v-else v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']"></div>
        </transition>
        <el-menu-item index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="24" height="24" />
          <template #title><span class="menu-name">{{ $t('analytics') }}</span></template>
        </el-menu-item>
        <el-menu-item index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <template #title><span class="menu-name">{{ $t('allUsers') }}</span></template>
        </el-menu-item>
        <el-menu-item index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <template #title><span class="menu-name">{{ $t('allMail') }}</span></template>
        </el-menu-item>
        <el-menu-item index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <template #title><span class="menu-name">{{ $t('permissions') }}</span></template>
        </el-menu-item>
        <el-menu-item index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <template #title><span class="menu-name">{{ $t('inviteCode') }}</span></template>
        </el-menu-item>
        <el-menu-item index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <template #title><span class="menu-name">{{ $t('SystemSettings') }}</span></template>
        </el-menu-item>
      </el-menu>
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

const settingStore = useSettingStore();
const uiStore = useUiStore();
const emailStore = useEmailStore();
const route = useRoute();

function openCompose() {
  emailStore.contentData.composeMode = 'new'
  emailStore.contentData.email = {}
  uiStore.writerRef.open()
}

function handleMenuSelect(index) {
  if (index) {
    router.push({ name: index })
  }
}
</script>

<style lang="scss" scoped>
.title {
  margin: 15px auto;
  height: 45px;
  border-radius: 6px;
  display: flex;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  cursor: pointer;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border-radius 0.3s ease, margin 0.3s ease, padding 0.3s ease;
  width: 130px;
  padding: 0 10px;
  > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(130px - 20px - 30px);
  }
}

.title-collapsed {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  margin: 10px auto;
  padding: 0;
  max-width: 40px;
  justify-content: center;
}

.fade-text-enter-active, .fade-text-leave-active {
  transition: opacity 0.25s ease;
}
.fade-text-enter-from, .fade-text-leave-to {
  opacity: 0;
}

.manage-title {
  margin-top: 10px;
  padding-left: 20px;
  color: #fff;
  font-size: 13px;
  height: 20px;
}

.manage-divider {
  margin: 10px 10px;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.el-menu-item {
  margin: 5px 10px;
  border-radius: 6px;
  height: 38px;
  display: flex;
  align-items: center;
}

:deep(.el-menu--collapse) .el-menu-item {
  margin: 5px auto;
  width: 44px;
  padding: 0 !important;
  justify-content: center;
}

.el-menu:not(.el-menu--collapse) .el-menu-item {
  padding: 0 10px !important;
  gap: 10px;
}

:deep(.el-menu-item .el-menu-tooltip__trigger) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 !important;
}

.choose-item {
  font-weight: bold;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(4px);
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: rgba(255, 255, 255, 0.08) !important;
  }
}

.menu-name { user-select: none; }

:deep(.el-scrollbar__wrap--hidden-default) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: var(--aside-backgound);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
  transition: width 0.3s ease;
}

.el-menu {
  border-right: 0;
  width: 100%;
}

:deep(.el-menu--collapse) {
  width: 100%;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}

.scroll {
  height: 100%;
}
</style>
