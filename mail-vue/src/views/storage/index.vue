<template>
  <div class="storage-container">
    <div class="storage-header">
      <h2>{{ $t('storageManagement') }}</h2>
      <el-button size="small" @click="refresh" :loading="loading">{{ $t('refresh') }}</el-button>
    </div>

    <div class="storage-cards">
      <!-- D1 Card -->
      <div class="storage-card">
        <div class="card-header">
          <span class="card-title">D1 Database</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference>
              <Icon icon="mingcute:information-line" width="18" class="info-icon"/>
            </template>
            <div class="pricing-pop">
              <div class="pp-title">D1 Cloudflare</div>
              <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.75/GB-mo</span></div>
              <div class="pp-row"><span>Rows read</span><span>Free</span></div>
              <div class="pp-row"><span>Rows written</span><span>Free</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>5 GB storage</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--el-border-color-light)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#409EFF" stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="d1Pct * 3.14 + ' ' + (314 - d1Pct * 3.14)" stroke-dashoffset="78.5"
                transform="rotate(-90 60 60)" style="transition: stroke-dasharray 0.6s ease"/>
            </svg>
            <div class="ring-label">{{ d1Data.totalRows?.toLocaleString() || 0 }}<br><small>rows</small></div>
          </div>
          <div class="card-stats">
            <div class="stat-line" v-for="t in d1Data.tables" :key="t.table">
              <span class="stat-label">{{ t.table }}</span>
              <span class="stat-value">{{ t.count.toLocaleString() }}</span>
            </div>
            <div class="stat-line total">
              <span class="stat-label">{{ $t('totalSize') }}</span>
              <span class="stat-value">{{ fmtBytes(d1Data.billingBytes) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- KV Card -->
      <div class="storage-card">
        <div class="card-header">
          <span class="card-title">KV Storage</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference>
              <Icon icon="mingcute:information-line" width="18" class="info-icon"/>
            </template>
            <div class="pricing-pop">
              <div class="pp-title">KV Cloudflare</div>
              <div class="pp-row"><span>{{ $t('readPrice') }}</span><span>$0.50/million</span></div>
              <div class="pp-row"><span>{{ $t('writePrice') }}</span><span>$5.00/million</span></div>
              <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.50/GB-mo</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>100K reads/day</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--el-border-color-light)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#67C23A" stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="kvPct * 3.14 + ' ' + (314 - kvPct * 3.14)" stroke-dashoffset="78.5"
                transform="rotate(-90 60 60)" style="transition: stroke-dasharray 0.6s ease"/>
            </svg>
            <div class="ring-label">{{ (kvData.keyCount || 0).toLocaleString() }}<br><small>keys</small></div>
          </div>
          <div class="card-stats">
            <div class="stat-line">
              <span class="stat-label">{{ $t('keyCount') }}</span>
              <span class="stat-value">{{ (kvData.keyCount || 0).toLocaleString() }}</span>
            </div>
            <div class="stat-line total">
              <span class="stat-label">{{ $t('totalSize') }}</span>
              <span class="stat-value">{{ fmtBytes(kvData.billingBytes) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- R2 Card -->
      <div class="storage-card">
        <div class="card-header">
          <span class="card-title">R2 Storage</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference>
              <Icon icon="mingcute:information-line" width="18" class="info-icon"/>
            </template>
            <div class="pricing-pop">
              <div class="pp-title">R2 Cloudflare</div>
              <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.015/GB-mo</span></div>
              <div class="pp-row"><span>{{ $t('classAOps') }}</span><span>$4.50/million</span></div>
              <div class="pp-row"><span>{{ $t('classBOps') }}</span><span>$0.36/million</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>10 GB</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--el-border-color-light)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E6A23C" stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="r2Pct * 3.14 + ' ' + (314 - r2Pct * 3.14)" stroke-dashoffset="78.5"
                transform="rotate(-90 60 60)" style="transition: stroke-dasharray 0.6s ease"/>
            </svg>
            <div class="ring-label">{{ fmtBytes(r2Data.totalSize) }}<br><small>total</small></div>
          </div>
          <div class="card-stats">
            <div class="stat-line">
              <span class="stat-label">{{ $t('objectCount') }}</span>
              <span class="stat-value">{{ (r2Data.objectCount || 0).toLocaleString() }}</span>
            </div>
            <template v-if="r2Data.typeStats">
              <div class="stat-line">
                <span class="stat-label">📎 Attachments</span>
                <span class="stat-value">{{ r2Data.typeStats.attachments || 0 }} ({{ fmtBytes(r2Data.typeStats.attachmentsSize) }})</span>
              </div>
              <div class="stat-line">
                <span class="stat-label">🖼  Images</span>
                <span class="stat-value">{{ r2Data.typeStats.images || 0 }} ({{ fmtBytes(r2Data.typeStats.imagesSize) }})</span>
              </div>
              <div class="stat-line">
                <span class="stat-label">{{ $t('other') }}</span>
                <span class="stat-value">{{ r2Data.typeStats.other || 0 }} ({{ fmtBytes(r2Data.typeStats.otherSize) }})</span>
              </div>
            </template>
            <div class="stat-line total">
              <span class="stat-label">{{ $t('totalSize') }}</span>
              <span class="stat-value">{{ fmtBytes(r2Data.totalSize) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-note" v-if="dataReady">{{ $t('dataDelayNote') }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";
import { storageStats } from "@/request/storage.js";

defineOptions({ name: 'storage' })
const { t } = useI18n()

const loading = ref(false)
const dataReady = ref(false)
const d1Data = ref({ tables: [], totalRows: 0, billingBytes: 0 })
const kvData = ref({ keyCount: 0, billingBytes: 0 })
const r2Data = ref({ objectCount: 0, totalSize: 0, typeStats: null, billingBytes: 0 })

const d1Pct = computed(() => Math.max(3, Math.min(95, (d1Data.value.totalRows || 0) / 100)))
const kvPct = computed(() => Math.max(3, Math.min(95, (kvData.value.keyCount || 0) / 100)))
const r2Pct = computed(() => Math.max(3, Math.min(95, ((r2Data.value.objectCount || 0) / 100))))

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB'
  return (bytes / 1073741824).toFixed(3) + ' GB'
}

onMounted(() => { refresh() })

async function refresh() {
  loading.value = true
  try {
    const res = await storageStats()
    d1Data.value = res.d1 || { tables: [], totalRows: 0 }
    kvData.value = res.kv || { keyCount: 0 }
    r2Data.value = res.r2 || { objectCount: 0, totalSize: 0 }
    dataReady.value = true
  } catch (e) {
    console.error('Failed to load storage stats:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.storage-container { padding: 20px; height: 100%; overflow-y: auto; }

.storage-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
  h2 { margin: 0; font-size: 20px; }
}

.storage-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }

.storage-card { background: var(--el-bg-color); border:1px solid var(--el-border-color-light); border-radius: 8px; padding: 20px; }

.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  .card-title { font-weight: bold; font-size: 16px; }
  .info-icon { cursor: pointer; color: var(--el-text-color-secondary); }
}

.card-body { display: flex; gap: 24px; align-items: flex-start; }

.ring-chart { position: relative; width: 100px; height: 100px; flex-shrink: 0;
  svg { width: 100%; height: 100%; }
}

.ring-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 12px; font-weight: bold;
  text-align: center; color: var(--el-text-color-primary); line-height: 1.2;
  small { font-weight: normal; color: var(--el-text-color-secondary); font-size: 10px; }
}

.card-stats { flex:1; min-width:0;
  .stat-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; border-bottom:1px solid var(--el-border-color-extra-light);
    &:last-child { border-bottom:none; }
    &.total { font-weight: bold; border-top:1px solid var(--el-border-color-light); margin-top:2px; padding-top:6px; }
  }
  .stat-label { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .stat-value { font-weight: 500; flex-shrink:0; margin-left:10px; text-align: right; }
}

.pricing-pop { font-size:13px;
  .pp-title { font-weight:bold; margin-bottom:8px; }
  .pp-row { display:flex; justify-content:space-between; padding:2px 0; }
}

.data-note { text-align:center; color:var(--el-text-color-placeholder); font-size:12px; margin-top:20px; }
</style>
