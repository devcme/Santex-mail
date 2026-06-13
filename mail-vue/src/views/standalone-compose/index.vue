<template>
  <div class="standalone-compose">
    <div class="compose-box">
      <div class="compose-header">
        <div class="compose-title">
          <Icon icon="hugeicons:quill-write-01" width="28" height="28"/>
          <span class="sender-label">{{ $t('sender') }}:</span>
          <span class="sender-name">{{ form.name }}</span>
          <span class="sender-email"><{{ form.sendEmail }}></span>
        </div>
        <div class="header-actions">
          <template v-if="hasContent">
            <el-tooltip :content="$t('save')" placement="bottom">
              <Icon icon="mdi:content-save-outline" width="22" height="22" @click="saveDraftLocal" style="cursor: pointer; color: var(--el-text-color-regular);" />
            </el-tooltip>
            <el-tooltip :content="$t('delete')" placement="bottom">
              <Icon icon="mdi:trash-can-outline" width="22" height="22" @click="confirmDiscardLocal" style="cursor: pointer; color: var(--el-text-color-regular);" />
            </el-tooltip>
          </template>
          <template v-else>
            <Icon icon="material-symbols-light:close-rounded" width="22" height="22" @click="window.close()" style="cursor: pointer;"/>
          </template>
        </div>
      </div>
      <div class="compose-container">
        <el-input-tag v-model="form.receiveEmail" tag-type="primary" size="default" class="recipient-input">
          <template #prefix>
            <div class="item-title">{{ $t('recipient') }}</div>
          </template>
        </el-input-tag>
        <el-input v-model="form.subject" :placeholder="t('subject')" />
        <tinyEditor :def-value="defValue" ref="editor" @change="onEditorChange" />
        <div class="button-row">
          <div class="att-add" @click="chooseFile">
            <Icon icon="iconamoon:attachment-fill" width="24" height="24"/>
          </div>
          <div class="att-list">
            <div class="att-item" v-for="(item, index) in form.attachments" :key="index">
              <Icon v-bind="getIconByName(item.filename)"/>
              <span class="att-filename">{{ item.filename }}</span>
              <span class="att-size">{{ formatBytes(item.size) }}</span>
              <Icon style="cursor: pointer;" icon="material-symbols-light:close-rounded" @click="delAtt(index)" width="22" height="22"/>
            </div>
          </div>
          <div class="send-btn-wrap">
            <el-button type="primary" @click="sendEmail" v-if="form.sendType === 'reply'">{{ $t('reply') }}</el-button>
            <el-button type="primary" @click="sendEmail" v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</el-button>
            <el-button type="primary" @click="sendEmail" v-else>{{ $t('send') }}</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import { reactive, ref, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import { useUserStore } from "@/store/user.js";
import { emailSend } from "@/request/email.js";
import { useAccountStore } from "@/store/account.js";
import { useEmailStore } from "@/store/email.js";
import { fileToBase64, formatBytes } from "@/utils/file-utils.js";
import { getIconByName } from "@/utils/icon-utils.js";
import { toOssDomain } from "@/utils/convert.js";
import { formatDetailDate } from "@/utils/day.js";
import { useSettingStore } from "@/store/setting.js";
import { useWriterStore } from "@/store/writer.js";
import { useI18n } from "vue-i18n";
import sendPercent from "@/components/send-percent/index.vue"
import { h } from "vue";
import dayjs from "dayjs";

const { t } = useI18n()
const writerStore = useWriterStore();
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const userStore = useUserStore();
const editor = ref({})
const defValue = ref('')
let percentMessage = null
let sending = false
const percent = ref(0)

const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

onMounted(() => {
  if (!accountStore.currentAccount?.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }

  const composeDataRaw = localStorage.getItem('compose-data')
  if (composeDataRaw) {
    try {
      const composeData = JSON.parse(composeDataRaw)
      const mode = composeData.composeMode
      const email = composeData.email

      if (mode === 'reply' && email) {
        form.receiveEmail.push(email.sendEmail)
        form.subject = (email.subject && (
          email.subject.startsWith('Re:') ||
          email.subject.startsWith('Re：') ||
          email.subject.startsWith('回复：') ||
          email.subject.startsWith('回复:'))) ? email.subject : 'Re: ' + (email.subject || '')
        form.sendType = 'reply'
        form.emailId = email.emailId
        setTimeout(() => {
          defValue.value = `
          <div></div>
          <div>
          <br>
              ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
          </div>
          <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
            <article>
                ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
            </article>
          </blockquote>`
        }, 200)
      } else if (mode === 'forward' && email) {
        form.subject = email.subject || ''
        form.sendType = 'forward'
        setTimeout(() => {
          defValue.value = `
            ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
          `
        }, 200)
      } else if (mode === 'new' && email) {
        if (email.sendEmail) {
          form.receiveEmail = [email.sendEmail]
        }
        form.subject = email.subject || ''
        form.emailId = email.emailId || 0
        form.sendType = ''
      }

      editor.value.focus?.()
    } catch (e) {
      console.error('Failed to parse compose data:', e)
    }
  }

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('keydown', handleKeyDown, true);
  })
})

function onEditorChange(content, text) {
  form.content = content;
  form.text = text
}

const hasContent = computed(() => {
  return !!(form.content || form.subject || form.receiveEmail.length > 0)
})

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    event.stopPropagation()
    if (hasContent.value) {
      saveDraftLocal()
    } else {
      window.close()
    }
  }
}

function saveDraftLocal() {
  if (editor.value && editor.value.getContent) {
    form.content = editor.value.getContent()
  }
  localStorage.setItem('compose-data', JSON.stringify({
    composeMode: form.sendType || 'new',
    email: JSON.parse(JSON.stringify(form))
  }))
  window.close()
}

function confirmDiscardLocal() {
  ElMessageBox.confirm(t('discardContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    window.close()
  })
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {
    const fileList = e.target.files;
    for (const file of fileList) {
      const size = file.size
      const filename = file.name
      const contentType = file.type
      const content = await fileToBase64(file)
      form.attachments.push({ content, filename, size, contentType })
    }
  }
}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

async function sendEmail() {
  if (form.receiveEmail.length === 0) {
    ElMessage({ message: t('emptyRecipientMsg'), type: 'error', plain: true })
    return
  }
  if (!form.subject) {
    ElMessage({ message: t('emptySubjectMsg'), type: 'error', plain: true })
    return
  }
  if (!form.content) {
    form.content = editor.value.getContent?.()
  }
  if (!form.content) {
    ElMessage({ message: t('emptyContentMsg'), type: 'error', plain: true })
    return
  }
  if (sending) {
    ElMessage({ message: t('sendingErrorMsg'), type: 'error', plain: true })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, { value: percent.value, desc: t('sending') }),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })
    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', { style: 'color: teal' }, email.subject),
      position: 'bottom-right'
    })
    userStore.refreshUserInfo?.()
    addRecipientRecord()
    window.close()
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', { style: 'color: teal' }, e.message),
      position: 'bottom-right'
    })
    addRecipientRecord()
  }).finally(() => {
    percentMessage?.close()
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
      email => !form.receiveEmail.includes(email)
  );
  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}
</script>
<style scoped lang="scss">
.standalone-compose {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
}

.compose-box {
  background: var(--el-bg-color);
  width: min(1367px, calc(100% - 80px));
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
  padding: 15px;
  border-radius: 8px;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  height: min(800px, calc(100vh - 60px));

  @media (max-width: 1024px) {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: 0;
    padding-top: 10px;
  }
}

.compose-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;

  .compose-title {
    align-items: center;
    display: grid;
    grid-template-columns: auto auto auto 1fr;
  }

  .sender-label { margin-left: 8px; }
  .sender-name { margin-left: 8px; font-weight: bold; }
  .sender-email { color: #999896; margin-left: 5px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }

  div {
    display: flex;
    align-items: center;
  }
}

.compose-container {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 15px;
}

.button-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;

  .att-add { cursor: pointer; }

  .att-list {
    display: grid;
    gap: 5px;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    padding-left: 10px;
    padding-right: 10px;
    max-height: 110px;
    overflow-y: auto;

    @media (max-width: 450px) {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }

    .att-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 5px;
      height: 32px;
      font-size: 14px;
      padding: 4px 5px;
      background: var(--light-ill);
      border-radius: 4px;
      .att-filename { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
    }
  }
}
</style>
