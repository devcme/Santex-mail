<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title" :class="{ 'title-collapsed': !uiStore.asideShow }" @click="openCompose">
        <Icon icon="material-symbols:edit-outline-sharp" width="22" height="22" />
        <transition name="fade-text">
          <div v-show="uiStore.asideShow">{{ settingStore.settings.title }}</div>
        </transition>
      </div>
      <el-menu :collapse="!uiStore.asideShow" text-color="#fff" active-text-color="#fff" style="margin-top: 10px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          </template>
          <template #title>{{ $t('inbox') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="cil:send" width="20" height="20" />
          </template>
          <template #title>{{ $t('sent') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="ep:document" width="19" height="19" />
          </template>
          <template #title>{{ $t('drafts') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="solar:star-line-duotone" width="20" height="20" />
          </template>
          <template #title>{{ $t('starred') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          </template>
          <template #title>{{ $t('settings') }}</template>
        </el-menu-item>
        <transition name="fade-text">
          <div class="manage-title" v-if="uiStore.asideShow" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
            <div>{{ $t('manage') }}</div>
          </div>
          <div class="manage-divider" v-else v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']"></div>
        </transition>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="fluent:data-pie-20-regular" width="24" height="24" />
          </template>
          <template #title>{{ $t('analytics') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="si:user-alt-2-line" width="20" height="20" />
          </template>
          <template #title>{{ $t('allUsers') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          </template>
          <template #title>{{ $t('allMail') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          </template>
          <template #title>{{ $t('permissions') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          </template>
          <template #title>{{ $t('inviteCode') }}</template>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <template #default>
            <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          </template>
          <template #title>{{ $t('SystemSettings') }}</template>
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
  margin: 15px 20px;
  height: 42px;
  border-radius: 6px;
  display: flex;
  position: relative;
  font-size: 14px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #ffffff;
  cursor: pointer;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border-radius 0.3s ease, margin 0.3s ease, padding 0.3s ease;
  width: 120px;
  padding: 0 8px;
  > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(120px - 16px - 28px);
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
  > div {
    display: none;
  }
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
  margin: 4px 10px;
  border-radius: 6px;
  height: 38px;
  display: flex;
  align-items: center;
}

:deep(.el-menu--collapse) .el-menu-item {
  margin: 4px 0 !important;
  padding: 0 !important;
  width: 100%;
  justify-content: center;
}

.el-menu:not(.el-menu--collapse) .el-menu-item {
  padding: 0 10px !important;
  gap: 8px;
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
