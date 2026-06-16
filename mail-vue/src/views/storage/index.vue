<template>
  <div class="storage-container">
    <div class="storage-toolbar">
      <h2>{{ $t('storageManagement') }}</h2>
      <div class="toolbar-controls">
        <el-select v-model="timeRange" @change="refresh" size="default">
          <el-option :label="$t('today')" value="1"/>
          <el-option :label="$t('last7Days')" value="7"/>
          <el-option :label="$t('last30Days')" value="30"/>
        </el-select>
        <el-input v-model="searchText" :placeholder="$t('searchResources')" clearable size="default" style="width:200px"/>
        <el-button size="default" @click="refresh" :loading="loading">{{ $t('refresh') }}</el-button>
      </div>
    </div>

    <div class="summary-row" v-if="!noToken">
      <div class="summary-card blue"><span class="sval">{{ fmtBytes(globalD1) }}</span><span class="slbl">D1</span></div>
      <div class="summary-card green"><span class="sval">{{ fmtBytes(globalKV) }}</span><span class="slbl">KV</span></div>
      <div class="summary-card orange"><span class="sval">{{ fmtBytes(globalR2) }}</span><span class="slbl">R2</span></div>
      <div class="summary-card"><span class="sval">{{ totalOps.toLocaleString() }}</span><span class="slbl">{{ $t('todayOps') }}</span></div>
    </div>

    <div class="chart-row" v-if="!noToken && hasData">
      <div class="chart-box" ref="storageChartRef"></div>
    </div>

    <div class="resource-section" v-if="!noToken">
      <el-tabs v-model="activeTab" @tab-change="refreshCharts">
        <el-tab-pane label="D1" name="d1">
          <div class="resource-grid">
            <div class="resource-card" v-for="r in filteredResources('d1')" :key="r.id">
              <div class="rc-header">
                <span class="rc-name" :title="r.name">{{ r.name }}</span>
                <el-popover placement="bottom" :width="260" trigger="hover">
                  <template #reference>
                    <Icon icon="mingcute:information-line" width="16" class="info-icon"/>
                  </template>
                  <div class="pricing-pop">
                    <div class="pp-title">D1 Cloudflare</div>
                    <div class="pp-row"><span>{{ $t('storagePrice') }}</span><span>$0.75/GB-mo</span></div>
                    <div class="pp-row"><span>{{ $t('rowsRead') }}</span><span>{{ r.rowsRead?.toLocaleString() || 0 }}</span></div>
                    <div class="pp-row"><span>{{ $t('rowsWritten') }}</span><span>{{ r.rowsWritten?.toLocaleString() || 0 }}</span></div>
                    <el-divider />
                    <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>5 GB</span></div>
                  </div>
                </el-popover>
              </div>
              <div class="rc-body">
                <div class="rc-stat"><label>{{ $t('storageUsed') }}</label><span>{{ fmtBytes(r.storageBytes) }}</span></div>
                <div class="rc-stat"><label>{{ $t('queryCount') }}</label><span>{{ (r.queryCount || 0).toLocaleString() }}</span></div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="KV" name="kv">
          <div class="resource-grid">
            <div class="resource-card" v-for="r in filteredResources('kv')" :key="r.id">
              <div class="rc-header" style="border-left:3px solid #67C23A">
                <span class="rc-name" :title="r.name">{{ r.name }}</span>
                <el-popover placement="bottom" :width="260" trigger="hover">
                  <template #reference>
                    <Icon icon="mingcute:information-line" width="16" class="info-icon"/>
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
              <div class="rc-body">
                <div class="rc-stat"><label>{{ $t('storageUsed') }}</label><span>{{ fmtBytes(r.storageBytes) }}</span></div>
                <div class="rc-stat"><label>{{ $t('operations') }}</label><span>{{ r.ops || 0 }}</span></div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="R2" name="r2">
          <div class="resource-grid">
            <div class="resource-card" v-for="r in filteredResources('r2')" :key="r.id">
              <div class="rc-header" style="border-left:3px solid #E6A23C">
                <span class="rc-name" :title="r.name">{{ r.name }}</span>
                <el-popover placement="bottom" :width="260" trigger="hover">
                  <template #reference>
                    <Icon icon="mingcute:information-line" width="16" class="info-icon"/>
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
              <div class="rc-body">
                <div class="rc-stat"><label>{{ $t('storageUsed') }}</label><span>{{ fmtBytes(r.storageBytes) }}</span></div>
                <div class="rc-stat"><label>{{ $t('objectCount') }}</label><span>{{ (r.objectCount || 0).toLocaleString() }}</span></div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-if="noToken" :description="$t('noApiToken')" />
    <div class="data-note" v-if="!noToken">{{ $t('dataDelayNote') }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";
import { storageResources, storageStats } from "@/request/storage.js";
import * as echarts from '@/echarts/index.js';

defineOptions({ name: 'storage' })
const { t } = useI18n()

const loading = ref(false)
const timeRange = ref('7')
const searchText = ref('')
const activeTab = ref('d1')
const noToken = ref(false)
const resources = ref({ d1: [], kv: [], r2: [] })
const statsData = ref(null)
const storageChartRef = ref(null)
let storageChart = null

const hasData = computed(() => {
  const d = statsData.value
  if (!d) return false
  return (d.d1Storage?.length || 0) + (d.kvStorage?.length || 0) + (d.r2Storage?.length || 0) > 0
})

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB'
  return (bytes / 1073741824).toFixed(3) + ' GB'
}

const mergedResources = computed(() => {
  const r = resources.value
  const s = statsData.value || {}
  const merge = (list, idKey, storageKey, opsKey, extra) => {
    return list.map(item => {
      const sid = item.id
      const storage = (s[storageKey] || []).find(x => (x.dimensions || {})[idKey] === sid)
      const ops = (s[opsKey] || []).find(x => (x.dimensions || {})[idKey] === sid)
      return {
        ...item,
        storageBytes: (storage?.sum?.storageBytes || storage?.sum?.storageBytes || 0),
        objectCount: storage?.sum?.objectCount || 0,
        rowsRead: storage?.sum?.rowsRead || 0,
        rowsWritten: storage?.sum?.rowsWritten || 0,
        queryCount: storage?.sum?.queryCount || 0,
        ops: ops?.count || 0,
        ...extra
      }
    })
  }

  return {
    d1: merge(r.d1, 'databaseTag', 'd1Storage', 'd1Ops', {}),
    kv: merge(r.kv, 'namespaceId', 'kvStorage', 'kvOps', {}),
    r2: merge(r.r2, 'bucketName', 'r2Storage', 'r2Ops', {})
  }
})

function filteredResources(type) {
  const list = mergedResources.value[type] || []
  if (!searchText.value) return list
  const q = searchText.value.toLowerCase()
  return list.filter(x => x.name?.toLowerCase().includes(q) || x.id?.toLowerCase().includes(q))
}

const globalD1 = computed(() => mergedResources.value.d1.reduce((s, r) => s + (r.storageBytes || 0), 0))
const globalKV = computed(() => mergedResources.value.kv.reduce((s, r) => s + (r.storageBytes || 0), 0))
const globalR2 = computed(() => mergedResources.value.r2.reduce((s, r) => s + (r.storageBytes || 0), 0))
const totalOps = computed(() => {
  const m = mergedResources.value
  return [...m.d1, ...m.kv, ...m.r2].reduce((s, r) => s + (r.ops || 0) + (r.queryCount || 0), 0)
})

function initChart() {
  if (!storageChartRef.value) return
  if (storageChart) storageChart.dispose()
  storageChart = echarts.init(storageChartRef.value)
  updateChart()
}

function updateChart() {
  if (!storageChart) return
  const m = mergedResources.value
  const d1Names = m.d1.map(x => x.name)
  const d1Sizes = m.d1.map(x => x.storageBytes || 0)
  const kvNames = m.kv.map(x => x.name)
  const kvSizes = m.kv.map(x => x.storageBytes || 0)
  const r2Names = m.r2.map(x => x.name)
  const r2Sizes = m.r2.map(x => x.storageBytes || 0)
  const allNames = [...d1Names, ...kvNames, ...r2Names]

  storageChart.setOption({
    title: { text: t('storageUsage'), left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter(p) { return p[0]?.name + ': ' + fmtBytes(p[0]?.value) } },
    xAxis: { type: 'category', data: allNames.length ? allNames : ['-'], axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { formatter: fmtBytes } },
    series: [
      { name: 'D1', type: 'bar', data: d1Sizes.length ? d1Sizes : [0], color: '#409EFF', barGap: '10%' },
      { name: 'KV', type: 'bar', data: kvSizes.length ? kvSizes : [0], color: '#67C23A', barGap: '10%' },
      { name: 'R2', type: 'bar', data: r2Sizes.length ? r2Sizes : [0], color: '#E6A23C', barGap: '10%' },
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 60 }
  })
}

function refreshCharts() { updateChart() }

onMounted(async () => {
  await Promise.all([loadResources(), loadStats()])
  nextTick(initChart)
})

async function loadResources() {
  try {
    const r = await storageResources()
    if (r.noToken) { noToken.value = true; return }
    resources.value = { d1: r.d1 || [], kv: r.kv || [], r2: r.r2 || [] }
  } catch (e) { console.error(e) }
}

async function loadStats() {
  const now = new Date()
  const start = new Date(now.getTime() - parseInt(timeRange.value) * 86400000)
  try {
    const s = await storageStats({
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    })
    statsData.value = s
  } catch (e) { console.error(e) }
}

async function refresh() {
  loading.value = true
  await loadStats()
  updateChart()
  loading.value = false
}
</script>

<style scoped lang="scss">
.storage-container { padding: 20px; height: 100%; overflow-y: auto; }

.storage-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; }
  .toolbar-controls { display: flex; gap: 10px; align-items: center; }
}

.summary-row { display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap;
  .summary-card { background: var(--el-bg-color); border:1px solid var(--el-border-color-light); border-radius: 8px; padding: 12px 20px; display: flex; flex-direction: column; align-items: center; min-width: 100px;
    .sval { font-size: 22px; font-weight: bold; }
    .slbl { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
    &.blue { border-top: 3px solid #409EFF; } &.green { border-top: 3px solid #67C23A; } &.orange { border-top: 3px solid #E6A23C; }
  }
}

.chart-row { margin-bottom: 20px; }
.chart-box { width: 100%; height: 300px; }

.resource-section { margin-top: 10px; }
.resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 10px; }

.resource-card { background: var(--el-bg-color); border:1px solid var(--el-border-color-light); border-radius: 8px; overflow: hidden;
  .rc-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--el-fill-color-light); border-left: 3px solid #409EFF;
    .rc-name { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .info-icon { cursor: pointer; color: var(--el-text-color-secondary); flex-shrink: 0; }
  }
  .rc-body { padding: 10px 14px; display: grid; gap: 6px;
    .rc-stat { display: flex; justify-content: space-between; font-size: 13px;
      label { color: var(--el-text-color-secondary); }
      span { font-weight: 500; }
    }
  }
}

.pricing-pop { font-size: 13px;
  .pp-title { font-weight: bold; margin-bottom: 8px; }
  .pp-row { display: flex; justify-content: space-between; padding: 2px 0; }
}

.data-note { text-align: center; color: var(--el-text-color-placeholder); font-size: 12px; margin-top: 16px; }
</style>
