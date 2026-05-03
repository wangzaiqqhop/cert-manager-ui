<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="never" class="dash-stat-card">
          <div class="dash-stat-body">
            <div class="dash-stat-icon" style="background: linear-gradient(135deg, #e8f0fe, #d4e4fd)">
              <el-icon :size="24" color="#00A0E9"><Document /></el-icon>
            </div>
            <div class="dash-stat-info">
              <div class="dash-stat-num">{{ stats.total }}</div>
              <div class="dash-stat-label">证书总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="dash-stat-card valid">
          <div class="dash-stat-body">
            <div class="dash-stat-icon" style="background: linear-gradient(135deg, #e8f8ee, #d0f0da)">
              <el-icon :size="24" color="#2d8f4e"><SuccessFilled /></el-icon>
            </div>
            <div class="dash-stat-info">
              <div class="dash-stat-num" style="color: #2d8f4e">{{ stats.valid }}</div>
              <div class="dash-stat-label">有效证书</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="dash-stat-card warning">
          <div class="dash-stat-body">
            <div class="dash-stat-icon" style="background: linear-gradient(135deg, #fef3e6, #fde8d0)">
              <el-icon :size="24" color="#e8922d"><Clock /></el-icon>
            </div>
            <div class="dash-stat-info">
              <div class="dash-stat-num" style="color: #e8922d">{{ stats.expiringSoon }}</div>
              <div class="dash-stat-label">即将过期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="dash-stat-card danger">
          <div class="dash-stat-body">
            <div class="dash-stat-icon" style="background: linear-gradient(135deg, #fde8ec, #fad0d8)">
              <el-icon :size="24" color="#dc3545"><WarningFilled /></el-icon>
            </div>
            <div class="dash-stat-info">
              <div class="dash-stat-num" style="color: #dc3545">{{ stats.expired }}</div>
              <div class="dash-stat-label">已过期</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 即将过期列表 + 类型分布 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header-wrap">
              <span class="brand-card-header">即将过期证书</span>
              <el-tag type="warning" size="small" effect="plain">30天内</el-tag>
            </div>
          </template>
          <el-table :data="stats.expiringList || []" size="small" stripe max-height="320" class="dash-table">
            <el-table-column prop="name" label="证书名称" show-overflow-tooltip />
            <el-table-column prop="personName" label="归属人" width="100" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">{{ certTypeLabel(row.type) }}</template>
            </el-table-column>
            <el-table-column prop="validTo" label="到期日" width="110" />
            <el-table-column prop="daysLeft" label="剩余" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.daysLeft <= 7 ? 'danger' : 'warning'" size="small" effect="dark">
                  {{ row.daysLeft }} 天
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span class="brand-card-header">证书类型分布</span>
          </template>
          <div v-if="Object.keys(stats.byType || {}).length === 0" class="dash-empty">
            <el-icon style="font-size:48px; color:#c0c4cc; margin-bottom:12px"><PieChart /></el-icon>
            <div style="color:#909399">暂无数据</div>
          </div>
          <div v-else v-for="(count, type) in stats.byType" :key="type" class="dash-type-bar">
            <div class="dash-type-header">
              <span class="dash-type-name">{{ certTypeLabel(type) }}</span>
              <span class="dash-type-count">{{ count }}</span>
            </div>
            <div class="dash-bar-track">
              <div class="dash-bar-fill" :style="{ width: barWidth(count) + '%' }"></div>
            </div>
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
import { Document, SuccessFilled, Clock, WarningFilled, PieChart } from '@element-plus/icons-vue'

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
.dash-stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  cursor: default;
}

.dash-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.dash-stat-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dash-stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dash-stat-info {
  flex: 1;
}

.dash-stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--brand-dark);
  line-height: 1.2;
}

.dash-stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.card-header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-card-header {
  font-size: 15px;
  font-weight: 700;
  color: var(--brand-dark);
  padding-left: 10px;
  border-left: 3px solid var(--brand-primary);
}

.dash-table {
  border-radius: 8px;
  overflow: hidden;
}

.dash-empty {
  text-align: center;
  padding: 48px 0;
}

.dash-type-bar {
  margin-bottom: 16px;
}

.dash-type-bar:last-child {
  margin-bottom: 0;
}

.dash-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.dash-type-name {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.dash-type-count {
  font-size: 13px;
  color: var(--brand-primary);
  font-weight: 600;
}

.dash-bar-track {
  height: 8px;
  background: #eef1f6;
  border-radius: 4px;
  overflow: hidden;
}

.dash-bar-fill {
  height: 100%;
  background: var(--brand-gradient);
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
