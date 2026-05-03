<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num">{{ stats.total }}</div>
          <div class="stat-label">证书总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top: 3px solid #67c23a">
          <div class="stat-num" style="color: #67c23a">{{ stats.valid }}</div>
          <div class="stat-label">有效</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top: 3px solid #e6a23c">
          <div class="stat-num" style="color: #e6a23c">{{ stats.expiringSoon }}</div>
          <div class="stat-label">即将过期</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top: 3px solid #f56c6c">
          <div class="stat-num" style="color: #f56c6c">{{ stats.expired }}</div>
          <div class="stat-label">已过期</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 即将过期列表 + 类型分布 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card>
          <template #header><span style="font-weight: bold">即将过期证书（30天内）</span></template>
          <el-table :data="stats.expiringList || []" size="small" stripe max-height="320">
            <el-table-column prop="name" label="证书名称" show-overflow-tooltip />
            <el-table-column prop="personName" label="归属人" width="100" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">{{ certTypeLabel(row.type) }}</template>
            </el-table-column>
            <el-table-column prop="validTo" label="到期日" width="110" />
            <el-table-column prop="daysLeft" label="剩余" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.daysLeft <= 7 ? 'danger' : 'warning'" size="small">{{ row.daysLeft }} 天</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span style="font-weight: bold">证书类型分布</span></template>
          <div v-if="Object.keys(stats.byType || {}).length === 0" style="color: #909399; text-align: center; padding: 40px 0">暂无数据</div>
          <div v-else v-for="(count, type) in stats.byType" :key="type" class="type-bar">
            <span class="type-name">{{ certTypeLabel(type) }}</span>
            <span class="type-count">{{ count }}</span>
            <div class="bar-bg"><div class="bar-fill" :style="{ width: barWidth(count) + '%' }"></div></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { certificateApi } from '../api/certificate'
import { certTypeLabel } from '../utils/certType'

const stats = ref({ total: 0, valid: 0, expiringSoon: 0, expired: 0, byType: {}, expiringList: [] })
let maxCount = 1

onMounted(async () => {
  try {
    const res = await certificateApi.stats()
    stats.value = res.data || stats.value
    const counts = Object.values(stats.value.byType || {})
    maxCount = counts.length > 0 ? Math.max(...counts) : 1
  } catch (e) { /* ignore */ }
})

function barWidth(count) {
  return Math.round((count / maxCount) * 100)
}
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-num { font-size: 32px; font-weight: bold; color: #303133; }
.stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
.type-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.type-name { width: 80px; font-size: 13px; text-align: right; color: #606266; flex-shrink: 0; }
.type-count { width: 30px; font-size: 13px; color: #909399; flex-shrink: 0; }
.bar-bg { flex: 1; height: 12px; background: #f0f2f5; border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; background: #409eff; border-radius: 6px; transition: width 0.5s; }
</style>
