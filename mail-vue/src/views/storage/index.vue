<template>
  <div class="storage-container">
    <div class="storage-header">
      <h2>{{ $t('storageManagement') }}</h2>
      <el-button size="small" @click="refresh" :loading="loading">{{ $t('refresh') }}</el-button>
    </div>

    <div class="storage-cards">
      <div class="storage-card" v-for="card in cards" :key="card.key">
        <div class="card-header">
          <span class="card-title">{{ card.title }}</span>
          <el-popover placement="bottom" :width="280" trigger="hover">
            <template #reference>
              <Icon icon="mingcute:information-line" width="18" class="info-icon"/>
            </template>
            <div class="pricing-pop">
              <div class="pp-title">{{ card.title }} Cloudflare</div>
              <div class="pp-row" v-for="p in card.pricing" :key="p.label">
                <span>{{ p.label }}</span><span>{{ p.value }}</span>
              </div>
              <el-divider />
              <div class="pp-row"><span>{{ $t('freeTier') }}</span><span>{{ card.freeTier }}</span></div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart" :ref="el => setChartRef(card.key, el)"></div>
          <div class="card-stats">
            <div class="stat-line" v-for="s in card.stats" :key="s.label">
              <span class="stat-label">{{ s.label }}</span>
              <span class="stat-value">{{ s.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-note" v-if="dataReady">{{ $t('dataDelayNote') }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";
import { storageStats } from "@/request/storage.js";
import * as echarts from '@/echarts/index.js';

defineOptions({ name: 'storage' })
const { t } = useI18n()

const loading = ref(false)
const dataReady = ref(false)
const d1Data = ref({ tables: [], totalRows: 0, billingBytes: 0 })
const kvData = ref({ keyCount: 0, billingBytes: 0 })
const r2Data = ref({ objectCount: 0, totalSize: 0, typeStats: null, billingBytes: 0 })

const chartRefs = {}
let charts = {}
function setChartRef(key, el) { if (el) chartRefs[key] = el }

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB'
  return (bytes / 1073741824).toFixed(3) + ' GB'
}

const cards = computed(() => {
  const d1 = d1Data.value, kv = kvData.value, r2 = r2Data.value
  const d1Used = fmtBytes(d1.billingBytes)
  const r2Used = fmtBytes(r2.totalSize)

  return [
    {
      key: 'd1', title: 'D1 Database',
      chartData: (d1.tables || []).filter(t => t && t.table && t.count != null).map(t => ({ name: t.table, value: t.count })),
      centerText: (d1.totalRows || 0).toLocaleString() + '\nrows',
      stats: [
        ...(d1.tables || []).filter(t => t).map(t => ({ label: t.table, value: (t.count || 0).toLocaleString() })),
        { label: t('totalSize') + ' (billing)', value: d1Used }
      ],
      pricing: [
        { label: t('storagePrice'), value: '$0.75/GB-mo' },
        { label: 'Rows read', value: 'Free' },
        { label: 'Rows written', value: 'Free' }
      ],
      freeTier: '5 GB'
    },
    {
      key: 'kv', title: 'KV Storage',
      chartData: [{ name: 'Keys', value: kv.keyCount || 0 }],
      centerText: (kv.keyCount || 0).toLocaleString() + '\nkeys',
      stats: [
        { label: t('keyCount'), value: (kv.keyCount || 0).toLocaleString() },
        { label: t('totalSize') + ' (billing)', value: fmtBytes(kv.billingBytes) }
      ],
      pricing: [
        { label: t('readPrice'), value: '$0.50/million' },
        { label: t('writePrice'), value: '$5.00/million' },
        { label: t('storagePrice'), value: '$0.50/GB-mo' }
      ],
      freeTier: '100K reads/day, 1GB'
    },
    {
      key: 'r2', title: 'R2 Storage',
      chartData: [
        { name: 'Attachments', value: r2.typeStats?.attachments || 0 },
        { name: 'Images', value: r2.typeStats?.images || 0 },
        { name: 'Other', value: r2.typeStats?.other || 0 }
      ],
      centerText: r2Used,
      stats: [
        { label: t('objectCount'), value: (r2.objectCount || 0).toLocaleString() },
        { label: '📎 Attachments', value: (r2.typeStats?.attachments || 0) + ' (' + fmtBytes(r2.typeStats?.attachmentsSize) + ')' },
        { label: '🖼 Images', value: (r2.typeStats?.images || 0) + ' (' + fmtBytes(r2.typeStats?.imagesSize) + ')' },
        { label: '🖼 Backgrounds', value: (r2.typeStats?.backgrounds || 0) + ' (' + fmtBytes(r2.typeStats?.backgroundsSize) + ')' },
        { label: t('other'), value: (r2.typeStats?.other || 0) + ' (' + fmtBytes(r2.typeStats?.otherSize) + ')' },
        { label: t('totalSize'), value: r2Used }
      ],
      pricing: [
        { label: t('storagePrice'), value: '$0.015/GB-mo' },
        { label: t('classAOps'), value: '$4.50/million' },
        { label: t('classBOps'), value: '$0.36/million' }
      ],
      freeTier: '10 GB'
    }
  ]
})

const bgColor = computed(() => {
  return document.documentElement.classList.contains('dark') ? '#1d1e1f' : '#ffffff'
})
const textColor = computed(() => {
  return document.documentElement.classList.contains('dark') ? '#E5EAF3' : '#303133'
})

function renderCharts() {
  nextTick(() => {
    cards.value.forEach(card => {
      const el = chartRefs[card.key]
      if (!el) return
      if (charts[card.key]) charts[card.key].dispose()
      const chart = echarts.init(el)
      charts[card.key] = chart
      chart.setOption({
        tooltip: { trigger: 'item', formatter: p => `${p.name}: ${p.value} (${p.percent}%)` },
        series: [{
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: card.chartData.length ? card.chartData : [{ name: '-', value: 1 }],
          color: card.key === 'd1' ? ['#409EFF','#79bbff','#a0cfff','#c6e2ff','#ecf5ff'] :
                 card.key === 'kv' ? ['#67C23A','#95d475','#b3e19d','#c2e7b0','#e1f3d8'] :
                 ['#E6A23C','#ebb563','#f0c78a','#f5dab1','#faecd8']
        }]
      })
    })
  })
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
    renderCharts()
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
