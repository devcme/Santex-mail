<template>
  <div class="email-detail-box">
    <div class="detail-header-actions">
      <Icon class="icon" icon="material-symbols-light:close-rounded" width="20" height="20" @click="handleClose"/>
      <Icon v-if="showDelete" class="icon" icon="uiw:delete" width="16" height="16" @click="handleDeleteClick"/>
      <span class="star" v-if="showStar">
        <Icon class="icon" @click="changeStar" v-if="email.isStar" icon="fluent-color:star-16" width="20" height="20"/>
        <Icon class="icon" @click="changeStar" v-else icon="solar:star-line-duotone" width="18" height="18"/>
      </span>
      <Icon class="icon" v-if="showReply" @click="handleReply" @dblclick="handleDblReply" icon="la:reply" width="21" height="21" />
      <Icon class="icon" v-if="showReply" @click="handleForward" @dblclick="handleDblForward" icon="iconoir:arrow-up-right" width="20" height="20" />
    </div>
    <el-scrollbar class="detail-scrollbar">
      <div class="detail-container">
        <div class="email-title">
          {{ email.subject }}
        </div>
        <div class="content">
          <div class="email-info">
            <div>
              <div class="send"><span class="send-source">{{ $t('from') }}</span>
                <div class="send-name">
                  <span class="send-name-title">{{ email.name }}</span>
                  <span><{{ email.sendEmail }}></span>
                </div>
              </div>
              <div class="receive"><span class="source">{{ $t('recipient') }}</span><span class="receive-email">{{ formateReceive(email.recipient) }}</span></div>
              <div class="date">
                <div>{{ formatDetailDate(email.createTime) }}</div>
              </div>
            </div>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>
          <el-scrollbar class="htm-scrollbar" :class="email.attList && email.attList.length === 0 ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text">{{ email.text }}</pre>
          </el-scrollbar>
          <div class="att" v-if="email.attList && email.attList.length > 0">
            <div class="att-title">
              <span>{{ $t('attachments') }}</span>
              <span>{{ $t('attCount', { total: email.attList.length }) }}</span>
            </div>
            <div class="att-box">
              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon-item" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" />
                </div>
                <div class="att-name" @click="showImage(att.key)">
                  {{ att.filename }}
                </div>
                <div class="att-size">{{ formatBytes(att.size) }}</div>
                <div class="opt-icon att-icon-item">
                  <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="22" height="22" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="system-uicons:push-down" width="22" height="22"/>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from 'element-plus'
import { emailRead } from "@/request/email.js";
import { Icon } from "@iconify/vue";
import { formatDetailDate } from "@/utils/day.js";
import { starAdd, starCancel } from "@/request/star.js";
import { getExtName, formatBytes } from "@/utils/file-utils.js";
import { cvtR2Url, toOssDomain } from "@/utils/convert.js";
import { getIconByName } from "@/utils/icon-utils.js";
import { useSettingStore } from "@/store/setting.js";
import { useEmailStore } from "@/store/email.js";
import { useI18n } from "vue-i18n";
import { EmailUnreadEnum } from "@/enums/email-enum.js";

const props = defineProps({
  email: {
    type: Object,
    required: true
  },
  showStar: {
    type: Boolean,
    default: true
  },
  showReply: {
    type: Boolean,
    default: true
  },
  showUnread: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  delType: {
    type: String,
    default: 'logic'
  }
})

const emit = defineEmits(['close', 'reply', 'forward', 'delete', 'star-change'])

const settingStore = useSettingStore();
const emailStore = useEmailStore();
const showPreview = ref(false)
const srcList = reactive([])
const { t } = useI18n()

onMounted(() => {
  if (props.showUnread && props.email.unread === EmailUnreadEnum.UNREAD) {
    props.email.unread = EmailUnreadEnum.READ;
    emailRead([props.email.emailId]);
  }
})

function handleClose() {
  emit('close')
}

let replyTimer = null
let forwardTimer = null

function handleReply() {
  if (replyTimer) clearTimeout(replyTimer)
  replyTimer = setTimeout(() => {
    replyTimer = null
    emit('reply', props.email)
  }, 250)
}

function handleDblReply() {
  if (replyTimer) {
    clearTimeout(replyTimer)
    replyTimer = null
  }
  localStorage.setItem('compose-data', JSON.stringify({
    composeMode: 'reply',
    email: JSON.parse(JSON.stringify(props.email))
  }))
  const url = `${window.location.origin}/compose`
  const win = window.open(url, '_blank', 'width=900,height=750')
  if (win) {
    win.focus()
  }
}

function handleForward() {
  if (forwardTimer) clearTimeout(forwardTimer)
  forwardTimer = setTimeout(() => {
    forwardTimer = null
    emit('forward', props.email)
  }, 250)
}

function handleDblForward() {
  if (forwardTimer) {
    clearTimeout(forwardTimer)
    forwardTimer = null
  }
  localStorage.setItem('compose-data', JSON.stringify({
    composeMode: 'forward',
    email: JSON.parse(JSON.stringify(props.email))
  }))
  const url = `${window.location.origin}/compose`
  const win = window.open(url, '_blank', 'width=900,height=750')
  if (win) {
    win.focus()
  }
}

function handleDeleteClick() {
  emit('delete', props.email)
}

function toMessage(message) {
  return message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  recipient = JSON.parse(recipient)
  return recipient.map(item => item.address).join(', ')
}

function changeStar() {
  if (props.email.isStar) {
    props.email.isStar = 0;
    starCancel(props.email.emailId).then(() => {
      props.email.isStar = 0;
    }).catch((e) => {
      console.error(e)
      props.email.isStar = 1;
    })
  } else {
    props.email.isStar = 1;
    starAdd(props.email.emailId).then(() => {
      props.email.isStar = 1;
    }).catch((e) => {
      console.error(e)
      props.email.isStar = 0;
    })
  }
  emit('star-change', props.email)
}
</script>
<style scoped lang="scss">
.email-detail-box {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header-actions {
  padding: 9px 15px 8px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--header-actions-border);
  font-size: 18px;
  flex-shrink: 0;
  .star {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 21px;
  }
  .icon {
    cursor: pointer;
  }
}

.detail-scrollbar {
  flex: 1;
  width: 100%;
}

.detail-container {
  font-size: 14px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 10px;
  @media (max-width: 1023px) {
    padding-left: 15px;
    padding-right: 15px;
  }

  .email-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .content {
    display: flex;
    flex-direction: column;

    .att {
      margin-top: 30px;
      margin-bottom: 30px;
      border: 1px solid var(--light-border-color);
      padding: 14px;
      border-radius: 6px;
      width: fit-content;
      .att-box {
        min-width: min(410px, calc(100vw - 60px));
        max-width: 600px;
        display: grid;
        gap: 12px;
        grid-template-rows: 1fr;
      }

      .att-title {
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        span:first-child {
          font-weight: bold;
        }
      }

      .att-item {
        cursor: pointer;
        div {
          align-self: center;
        }
        background: var(--light-ill);
        padding: 5px 7px;
        border-radius: 4px;
        align-self: start;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        .att-icon-item {
          display: grid;
        }

        .att-size {
          color: var(--secondary-text-color);
        }

        .att-name {
          margin-left: 8px;
          margin-right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
        }

        .opt-icon {
          padding-left: 10px;
          color: var(--secondary-text-color);
          align-items: center;
          display: flex;
          gap: 8px;
          cursor: pointer;
          a {
            color: var(--secondary-text-color);
            align-items: center;
            display: flex;
          }
        }
      }
    }

    .email-info {
      border-bottom: 1px solid var(--light-border-color);
      margin-bottom: 20px;
      padding-bottom: 8px;
      @media (max-width: 1024px) {
        margin-bottom: 15px;
      }
      .date {
        color: var(--regular-text-color);
        margin-bottom: 6px;
      }

      .email-msg {
        max-width: 400px;
        width: fit-content;
        margin-bottom: 15px;
      }

      .send {
        display: flex;
        margin-bottom: 6px;

        .send-name {
          color: var(--regular-text-color);
          display: flex;
          flex-wrap: wrap;
        }

        .send-name-title {
          padding-right: 5px;
        }
      }

      .receive {
        margin-bottom: 6px;
        display: flex;
        .receive-email {
          max-width: 700px;
          word-break: break-word;
        }
        span:nth-child(2) {
          color: var(--regular-text-color);
        }
      }

      .send-source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }

      .source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }
    }
  }
}

.shadow-html::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--message-block-color);
  pointer-events: none;
}

.email-text {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.bottom-distance {
  margin-bottom: 30px;
}
</style>
