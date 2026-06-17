<template>
  <div class="storage-container">
    <div class="storage-header">
      <h2>{{ $t('storageManagement') }}</h2>
      <el-button size="small" @click="refresh" :loading="loading">{{ $t('refresh') }}</el-button>
    </div>

    <div class="storage-cards">
      <!-- D1 -->
      <div class="storage-card">
        <div class="card-header">
          <span class="card-title">D1 Database</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference><Icon icon="mingcute:information-line" width="18" class="info-icon"/></template>
            <div class="pricing-pop">
              <div class="pp-title">D1 Cloudflare</div>
              <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.75/GB-mo</span></div>
              <div class="pp-row"><span>Reads</span><span>Free (25B/mo)</span></div>
              <div class="pp-row"><span>Writes</span><span>Free (50M/mo)</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>5 GB, 5M reads/day</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart" ref="d1Ring"></div>
          <div class="card-stats">
            <div class="pb-row"><span>Storage</span><span style="font-size:11px">{{ (d1Data.totalRows || 0).toLocaleString() }} rows / 5 GB</span></div>
            <div class="progress-bar"><div class="progress-fill blue" :style="{width: d1StoragePct + '%'}"></div></div>
            <div class="pb-row"><span>Reads (today)</span><span style="font-size:11px">— / 5M</span></div>
            <div class="progress-bar"><div class="progress-fill blue" :style="{width: Math.min(100, 0) + '%'}"></div></div>
            <div class="pb-row"><span>Writes (today)</span><span style="font-size:11px">— / 50M</span></div>
            <div class="progress-bar"><div class="progress-fill blue" :style="{width: Math.min(100, 0) + '%'}"></div></div>
            <div class="stat-line" v-for="t in (d1Data.tables || [])" :key="t.table" :class="{ 'stat-err': !t.ok }">
              <span class="stat-label">{{ t.table }}</span>
              <span class="stat-value">{{ (t.count || 0).toLocaleString() }}{{ t.ok === false ? ' ⚠' : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- KV -->
      <div class="storage-card">
        <div class="card-header">
          <span class="card-title">KV Storage</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference><Icon icon="mingcute:information-line" width="18" class="info-icon"/></template>
            <div class="pricing-pop">
              <div class="pp-title">KV Cloudflare</div>
              <div class="pp-row"><span>{{ $t('readPrice') }}</span><span>$0.50/million</span></div>
              <div class="pp-row"><span>{{ $t('writePrice') }}</span><span>$5.00/million</span></div>
              <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.50/GB-mo</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>100K reads/day, 1GB</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart" ref="kvRing"></div>
          <div class="card-stats">
            <div class="pb-row"><span>Storage</span><span style="font-size:11px">{{ (kvData.keyCount || 0).toLocaleString() }} keys / 1 GB</span></div>
            <div class="progress-bar"><div class="progress-fill green" :style="{width: Math.min(100, 2) + '%'}"></div></div>
            <div class="pb-row"><span>Reads (daily)</span><span style="font-size:11px">— / 100K</span></div>
            <div class="progress-bar"><div class="progress-fill green" :style="{width: Math.min(100, 0) + '%'}"></div></div>
            <div class="pb-row"><span>Writes (daily)</span><span style="font-size:11px">— / 1K</span></div>
            <div class="progress-bar"><div class="progress-fill green" :style="{width: Math.min(100, 0) + '%'}"></div></div>
            <div class="stat-line">
              <span class="stat-label">{{ $t('keyCount') }}</span>
              <span class="stat-value">{{ (kvData.keyCount || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- R2 -->
      <div class="storage-card">
        <div class="card-header">
          <span class="card-title">R2 Storage</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference><Icon icon="mingcute:information-line" width="18" class="info-icon"/></template>
            <div class="pricing-pop">
              <div class="pp-title">R2 Cloudflare</div>
              <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.015/GB-mo</span></div>
              <div class="pp-row"><span>{{ $t('classAOps') }}</span><span>$4.50/million</span></div>
              <div class="pp-row"><span>{{ $t('classBOps') }}</span><span>$0.36/million</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>10 GB, 1M Class A, 10M Class B</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart" ref="r2Ring"></div>
          <div class="card-stats">
            <div class="pb-row"><span>Storage</span><span style="font-size:11px">{{ fmtBytes(r2Data.totalSize) }} / 10 GB</span></div>
            <div class="progress-bar"><div class="progress-fill orange" :style="{width: r2StoragePct + '%'}"></div></div>
            <div class="pb-row"><span>Class A (write)</span><span style="font-size:11px">{{ (r2Data.objectCount || 0).toLocaleString() }} / 1M</span></div>
            <div class="progress-bar"><div class="progress-fill orange" :style="{width: Math.min(100, (r2Data.objectCount || 0) / 10000 * 100) + '%'}"></div></div>
            <div class="pb-row"><span>Class B (read)</span><span style="font-size:11px">— / 10M</span></div>
            <div class="progress-bar"><div class="progress-fill orange" :style="{width: Math.min(100, 0) + '%'}"></div></div>
            <template v-if="r2Data.categories">
              <div class="stat-line"><span class="stat-label">📎 Attachments</span><span class="stat-value">{{ r2Data.categories.attachments }} ({{ fmtBytes(r2Data.categories.attachmentsSize) }})</span></div>
              <div class="stat-line"><span class="stat-label">🖼 Backgrounds</span><span class="stat-value">{{ r2Data.categories.backgrounds }} ({{ fmtBytes(r2Data.categories.backgroundsSize) }})</span></div>
              <div class="stat-line"><span class="stat-label">🖼 Images</span><span class="stat-value">{{ r2Data.categories.images }} ({{ fmtBytes(r2Data.categories.imagesSize) }})</span></div>
              <div class="stat-line"><span class="stat-label">Other</span><span class="stat-value">{{ r2Data.categories.other }} ({{ fmtBytes(r2Data.categories.otherSize) }})</span></div>
              <div class="stat-line"><span class="stat-label">{{ $t('totalSize') }}</span><span class="stat-value">{{ fmtBytes(r2Data.totalSize) }}</span></div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <details class="debug-box" v-if="debug">
      <summary>🔍 Debug env keys</summary>
      <pre>{{ debug.envKeys?.join('\n') }}</pre>
      <pre>D1: {{ debug.d1Binding }}, KV: {{ debug.kvBinding }}, R2: {{ debug.r2Binding }}</pre>
    </details>

    <div class="data-note">{{ $t('dataDelayNote') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";
import { storageStats } from "@/request/storage.js";
import * as echarts from '@/echarts/index.js';

defineOptions({ name: 'storage' })
const { t } = useI18n()

const loading = ref(false)
const debug = ref(null)
const d1Ring = ref(null), kvRing = ref(null), r2Ring = ref(null)
let d1Chart = null, kvChart = null, r2Chart = null

const d1Data = ref({ tables: [], totalRows: 0 })
const kvData = ref({ keyCount: 0 })
const r2Data = ref({ objectCount: 0, totalSize: 0, categories: null })

const d1StoragePct = computed(() => Math.min(100, Math.max(1, (d1Data.value.totalRows || 0) / 50000 * 100)))
const r2StoragePct = computed(() => Math.min(100, Math.max(1, (r2Data.value.totalSize || 0) / 10737418240 * 100)))

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB'
  return (bytes / 1073741824).toFixed(3) + ' GB'
}

function renderRing(el, data, colors) {
  if (!el) return null
  if (chartsCache.has(el)) chartsCache.get(el).dispose()
  const c = echarts.init(el)
  chartsCache.set(el, c)
  c.setOption({
    tooltip: { trigger: 'item', formatter: p => `${p.name}: ${p.value} (${p.percent}%)` },
    series: [{
      type: 'pie', radius: ['50%', '75%'], center: ['50%', '50%'],
      avoidLabelOverlap: false, label: { show: false },
      emphasis: { label: { show: true } },
      data: data.length ? data : [{ name: 'No data', value: 1 }],
      color: colors
    }]
  })
  return c
}

const chartsCache = new Map()

function updateCharts() {
  nextTick(() => {
    const d1t = (d1Data.value.tables || []).filter(t => t.count > 0)
    d1Chart = renderRing(d1Ring.value,
      d1t.map(t => ({ name: t.table, value: t.count })),
      ['#409EFF','#79bbff','#a0cfff','#c6e2ff','#ecf5ff','#b3d8ff','#d4e8ff','#e8f4ff','#f0f8ff','#f5faff','#fafcff'])

    kvChart = renderRing(kvRing.value,
      [{ name: 'Keys', value: kvData.value.keyCount || 0 }],
      ['#67C23A','#95d475'])

    const cats = r2Data.value.categories
    if (cats) {
      r2Chart = renderRing(r2Ring.value, [
        { name: 'Attach', value: cats.attachments || 0 },
        { name: 'Background', value: cats.backgrounds || 0 },
        { name: 'Images', value: cats.images || 0 },
        { name: 'Other', value: cats.other || 0 }
      ].filter(d => d.value > 0), ['#E6A23C','#ebb563','#f0c78a','#f5dab1'])
    }
  })
}

onMounted(() => {
  refresh()
})

async function refresh() {
  loading.value = true
  try {
    const res = await storageStats()
    d1Data.value = res.d1 || {}
    kvData.value = res.kv || {}
    r2Data.value = res.r2 || {}
    debug.value = res._debug || null
    updateCharts()
  } catch (e) {
    console.error('Failed to load storage stats:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.storage-container { padding: 20px; height: 100%; overflow-y: auto; }
.storage-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; }
}
.storage-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
.storage-card { background: var(--el-bg-color); border:1px solid var(--el-border-color-light); border-radius: 8px; padding: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  .card-title { font-weight: bold; font-size: 16px; }
  .info-icon { cursor: pointer; color: var(--el-text-color-secondary); }
}
.card-body { display: flex; gap: 20px; align-items: flex-start; }
.ring-chart { width: 130px; height: 130px; flex-shrink: 0; }
.card-stats { flex:1; min-width:0; max-height: 260px; overflow-y: auto; }
.stat-line { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; border-bottom:1px solid var(--el-border-color-extra-light);
  &:last-child { border-bottom:none; }
  &.stat-err { color: var(--el-color-warning); }
}
.stat-label { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stat-value { font-weight: 500; flex-shrink:0; margin-left:10px; text-align: right; white-space: nowrap; }
.pb-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; color: var(--el-text-color-secondary); }
.progress-bar { width: 100%; height: 6px; background: var(--el-fill-color); border-radius: 3px; margin: 3px 0 6px; overflow: hidden;
  .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s;
    &.blue { background: #409EFF; } &.green { background: #67C23A; } &.orange { background: #E6A23C; }
  }
}
.pricing-pop { font-size:13px;
  .pp-title { font-weight:bold; margin-bottom:8px; }
  .pp-row { display:flex; justify-content:space-between; padding:2px 0; }
}
.debug-box { margin-top: 16px; padding: 10px; background: var(--el-fill-color); border-radius: 6px; font-size: 12px;
  summary { cursor: pointer; font-weight: bold; }
  pre { white-space: pre-wrap; word-break: break-all; margin: 4px 0; }
}
.data-note { text-align:center; color:var(--el-text-color-placeholder); font-size:12px; margin-top:14px; }
</style>
