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
              <Icon icon="mingcute:information-line" width="18" height="18" class="info-icon"/>
            </template>
            <div class="pricing-info">
              <div class="pricing-title">{{ $t('cloudflarePricing') }}</div>
              <div v-for="line in card.pricing" :key="line.label" class="pricing-line">
                <span>{{ line.label }}</span>
                <span>{{ line.value }}</span>
              </div>
              <el-divider />
              <div class="pricing-line">
                <span>{{ $t('freeTier') }}</span>
                <span>{{ card.freeTier }}</span>
              </div>
            </div>
          </el-popover>
        </div>
        <div class="card-body">
          <div class="ring-chart">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--el-border-color-light)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" :stroke="card.color" stroke-width="10"
                stroke-linecap="round" :stroke-dasharray="card.pct * 3.14 + ' ' + (314 - card.pct * 3.14)"
                stroke-dashoffset="78.5" transform="rotate(-90 60 60)" style="transition: stroke-dasharray 0.6s ease"/>
            </svg>
            <div class="ring-label">{{ card.pctText }}</div>
          </div>
          <div class="card-stats">
            <div class="stat-line" v-for="s in card.stats" :key="s.label">
              <span class="stat-label">{{ s.label }}</span>
              <span class="stat-value">{{ s.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
const stats = ref({})

const cards = computed(() => {
  const d = stats.value
  if (!d.d1 && !d.kv && !d.r2) return []

  const d1List = d.d1?.tables || []
  const d1Total = d1List.reduce((s, t) => s + (t.count || 0), 0)
  const d1Pct = Math.min(100, Math.round((0 / 5) * 100)) // estimated storage percentage based on rows

  const r2Size = d.r2?.totalSizeGB || 0
  const r2Pct = Math.min(100, Math.round((r2Size / (d.r2?.freeStorageGB || 10)) * 100))

  const kvCount = d.kv?.keyCount || 0
  const kvPct = Math.min(100, Math.round((kvCount / 100000) * 100))

  return [
    {
      key: 'd1',
      title: 'D1 Database',
      color: '#409EFF',
      pct: Math.max(5, d1Total > 0 ? Math.min(95, 10 + d1Total / 100) : 5),
      pctText: d1Total.toLocaleString(),
      freeTier: d.d1?.freeGB + ' GB',
      stats: d1List.slice(0, 6).map(t => ({ label: t.table, value: t.count })),
      pricing: [
        { label: t('storagePrice'), value: '$0.75/GB-month' },
        { label: t('readPrice'), value: t('d1ReadPricing') },
        { label: t('writePrice'), value: t('d1WritePricing') }
      ]
    },
    {
      key: 'kv',
      title: 'KV Storage',
      color: '#67C23A',
      pct: Math.max(5, Math.min(95, kvPct)),
      pctText: kvCount.toLocaleString() + ' keys',
      freeTier: '100K reads/day, 1K writes/day, 1GB',
      stats: [
        { label: t('keyCount'), value: kvCount },
        { label: t('storageUsed'), value: (d.kv?.storageGB || 0) + ' GB' },
      ],
      pricing: [
        { label: t('readPrice'), value: '$0.50/million' },
        { label: t('writePrice'), value: '$5.00/million' },
        { label: t('storagePrice'), value: '$0.50/GB-month' }
      ]
    },
    {
      key: 'r2',
      title: 'R2 Storage',
      color: '#E6A23C',
      pct: Math.max(5, Math.min(95, r2Pct)),
      pctText: r2Size.toFixed(2) + ' GB',
      freeTier: '10 GB',
      stats: [
        { label: t('objectCount'), value: d.r2?.objectCount },
        { label: t('totalSize'), value: r2Size.toFixed(2) + ' GB' },
      ],
      pricing: [
        { label: t('storagePrice'), value: '$0.015/GB-month' },
        { label: t('classAOps'), value: '$4.50/million' },
        { label: t('classBOps'), value: '$0.36/million' }
      ]
    }
  ]
})

onMounted(() => { refresh() })

async function refresh() {
  loading.value = true
  try {
    const res = await storageStats()
    stats.value = res
  } catch (e) {
    console.error('Failed to load storage stats:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.storage-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.storage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 { margin: 0; font-size: 20px; }
}

.storage-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.storage-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  .card-title { font-weight: bold; font-size: 16px; }
  .info-icon { cursor: pointer; color: var(--el-text-color-secondary); }
}

.card-body {
  display: flex;
  gap: 24px;
  align-items: center;
}

.ring-chart {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  svg { width: 100%; height: 100%; }
}

.ring-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  color: var(--el-text-color-primary);
  max-width: 80px;
  word-break: break-all;
  line-height: 1.2;
}

.card-stats {
  flex: 1;
  min-width: 0;
  .stat-line {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    &:last-child { border-bottom: none; }
  }
  .stat-label { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .stat-value { font-weight: 500; flex-shrink: 0; margin-left: 10px; }
}

.pricing-info {
  .pricing-title { font-weight: bold; margin-bottom: 8px; }
  .pricing-line { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
}
</style>
