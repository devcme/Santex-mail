<template>
  <div class="storage-container">
    <div class="storage-header">
      <h2>{{ $t('storageManagement') }}</h2>
      <el-button size="small" @click="refresh" :loading="loading">{{ $t('refresh') }}</el-button>
    </div>

    <div class="binding-warn" v-if="hasBindingErrors">
      <template v-if="d1Data.binding === 'missing'">D1 binding missing | </template>
      <template v-if="kvData.binding === 'missing'">KV binding missing | </template>
      <template v-if="r2Data.binding === 'missing'">R2 binding missing</template>
    </div>

    <div class="storage-cards" v-if="dataReady">
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
              <div class="pp-row"><span>Rows read/write</span><span>Free</span></div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>5 GB</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart" ref="d1ChartRef"></div>
          <div class="card-stats">
            <div class="stat-line" v-for="t in (d1Data.tables || [])" :key="t.table">
              <span class="stat-label">{{ t.table }}</span>
              <span class="stat-value">{{ (t.count || 0).toLocaleString() }}</span>
            </div>
            <div class="stat-line"><span class="stat-label">Total rows</span><span class="stat-value">{{ (d1Data.totalRows || 0).toLocaleString() }}</span></div>
          </div>
        </div>
      </div>

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
          <div class="ring-chart" ref="kvChartRef"></div>
          <div class="card-stats">
            <div class="stat-line">
              <span class="stat-label">{{ $t('keyCount') }}</span>
              <span class="stat-value">{{ (kvData.keyCount || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

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
          <div class="ring-chart" ref="r2ChartRef"></div>
          <div class="card-stats">
            <div class="stat-line">
              <span class="stat-label">{{ $t('objectCount') }}</span>
              <span class="stat-value">{{ (r2Data.objectCount || 0).toLocaleString() }}</span>
            </div>
            <div class="stat-line">
              <span class="stat-label">Attachments</span>
              <span class="stat-value">{{ r2Data.typeStats?.attachments || 0 }} ({{ fmtBytes(r2Data.typeStats?.attachmentsSize) }})</span>
            </div>
            <div class="stat-line">
              <span class="stat-label">Images</span>
              <span class="stat-value">{{ r2Data.typeStats?.images || 0 }} ({{ fmtBytes(r2Data.typeStats?.imagesSize) }})</span>
            </div>
            <div class="stat-line">
              <span class="stat-label">Backgrounds</span>
              <span class="stat-value">{{ r2Data.typeStats?.backgrounds || 0 }} ({{ fmtBytes(r2Data.typeStats?.backgroundsSize) }})</span>
            </div>
            <div class="stat-line">
              <span class="stat-label">{{ $t('other') }}</span>
              <span class="stat-value">{{ r2Data.typeStats?.other || 0 }} ({{ fmtBytes(r2Data.typeStats?.otherSize) }})</span>
            </div>
            <div class="stat-line">
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
import { ref, onMounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";
import { storageStats } from "@/request/storage.js";
import * as echarts from '@/echarts/index.js';

defineOptions({ name: 'storage' })
const { t } = useI18n()

const loading = ref(false)
const dataReady = ref(false)
const d1ChartRef = ref(null), kvChartRef = ref(null), r2ChartRef = ref(null)
let d1Chart = null, kvChart = null, r2Chart = null

const d1Data = ref({ tables: [], totalRows: 0 })
const kvData = ref({ keyCount: 0 })
const r2Data = ref({ objectCount: 0, totalSize: 0, typeStats: null })

const hasBindingErrors = ref(false)

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB'
  return (bytes / 1073741824).toFixed(3) + ' GB'
}

function makeRingChart(el, data, color) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: p => `${p.name}: ${p.value} (${p.percent}%)` },
    series: [{
      type: 'pie', radius: ['50%', '75%'], center: ['50%', '50%'],
      avoidLabelOverlap: false, label: { show: false },
      emphasis: { label: { show: true } },
      data, color
    }]
  })
  return chart
}

onMounted(() => refresh())

async function refresh() {
  loading.value = true
  try {
    const res = await storageStats()
    d1Data.value = res.d1 || {}
    kvData.value = res.kv || {}
    r2Data.value = res.r2 || {}

    const errs = [d1Data.value.binding === 'missing', kvData.value.binding === 'missing', r2Data.value.binding === 'missing']
    hasBindingErrors.value = errs.some(Boolean)

    dataReady.value = true

    await nextTick()
    await nextTick() // double nextTick to ensure DOM ready

    if (d1Chart) d1Chart.dispose()
    if (d1ChartRef.value) {
      const tables = (d1Data.value.tables || []).filter(t => t.count > 0)
      d1Chart = makeRingChart(d1ChartRef.value, tables.map(t => ({ name: t.table, value: t.count })), ['#409EFF','#79bbff','#a0cfff','#c6e2ff','#ecf5ff','#b3d8ff','#d4e8ff'])
    }

    if (kvChart) kvChart.dispose()
    if (kvChartRef.value) {
      kvChart = makeRingChart(kvChartRef.value, [{ name: 'Keys', value: kvData.value.keyCount || 0 }], ['#67C23A','#95d475'])
    }

    if (r2Chart) r2Chart.dispose()
    if (r2ChartRef.value && r2Data.value.typeStats) {
      const ts = r2Data.value.typeStats
      r2Chart = makeRingChart(r2ChartRef.value, [
        { name: 'Attachments', value: ts.attachments || 0 },
        { name: 'Images', value: ts.images || 0 },
        { name: 'Backgrounds', value: ts.backgrounds || 0 },
        { name: 'Other', value: ts.other || 0 }
      ].filter(d => d.value > 0), ['#E6A23C','#ebb563','#f0c78a','#f5dab1'])
    }

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
.binding-warn { background: var(--el-color-warning-light-9); color: var(--el-color-warning); padding: 8px 14px; border-radius: 6px; margin-bottom: 14px; font-size: 13px; }
.storage-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
.storage-card { background: var(--el-bg-color); border:1px solid var(--el-border-color-light); border-radius: 8px; padding: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  .card-title { font-weight: bold; font-size: 16px; }
  .info-icon { cursor: pointer; color: var(--el-text-color-secondary); }
}
.card-body { display: flex; gap: 20px; align-items: flex-start; }
.ring-chart { width: 140px; height: 140px; flex-shrink: 0; }
.card-stats { flex:1; min-width:0; max-height: 200px; overflow-y: auto;
  .stat-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; border-bottom:1px solid var(--el-border-color-extra-light);
    &:last-child { border-bottom:none; }
  }
  .stat-label { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .stat-value { font-weight: 500; flex-shrink:0; margin-left:10px; text-align: right; white-space: nowrap; }
}
.pricing-pop { font-size:13px;
  .pp-title { font-weight:bold; margin-bottom:8px; }
  .pp-row { display:flex; justify-content:space-between; padding:2px 0; }
}
.data-note { text-align:center; color:var(--el-text-color-placeholder); font-size:12px; margin-top:20px; }
</style>
