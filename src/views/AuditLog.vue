<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <!---flex: 自适应弹性布局  
        justify-content ： 横向布局    
        align-items：纵向布局 -->
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">审计日志</span>
          <el-button type="success" @click="handleExport" :loading="exporting">
            <el-icon style="margin-right: 4px"><Download /></el-icon>导出
          </el-button>
        </div>
      </template>

      <!-- Filter Toolbar -->
      <!-- flex-wrap：自动换行 -->
      <div class="toolbar" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="loadData"
        />
        <!--v-model 用来绑定变量
        clearable style 清除按钮-->
        <el-select v-model="queryParams.action" placeholder="操作类型" clearable style="width: 160px" @change="loadData">
          <el-option label="CERT_UPLOAD" value="CERT_UPLOAD" />
          <el-option label="CERT_UPDATE" value="CERT_UPDATE" />
          <el-option label="CERT_DELETE" value="CERT_DELETE" />
          <el-option label="CERT_VIEW" value="CERT_VIEW" />
          <el-option label="CERT_DOWNLOAD" value="CERT_DOWNLOAD" />
          <el-option label="PERSON_CREATE" value="PERSON_CREATE" />
          <el-option label="PERSON_UPDATE" value="PERSON_UPDATE" />
          <el-option label="PERSON_DELETE" value="PERSON_DELETE" />
          <el-option label="USER_CREATE" value="USER_CREATE" />
          <el-option label="USER_UPDATE" value="USER_UPDATE" />
          <el-option label="USER_DELETE" value="USER_DELETE" />
          <el-option label="PASSWORD_CHANGE" value="PASSWORD_CHANGE" />
          <el-option label="LOGIN" value="LOGIN" />
          <el-option label="LOGOUT" value="LOGOUT" />
          <el-option label="FILE_ADD" value="FILE_ADD" />
          <el-option label="FILE_REPLACE" value="FILE_REPLACE" />
          <el-option label="FILE_DELETE" value="FILE_DELETE" />
        </el-select>

        <el-select v-model="queryParams.resourceType" placeholder="资源类型" clearable style="width: 160px" @change="loadData">
          <el-option label="CERTIFICATE" value="CERTIFICATE" />
          <el-option label="PERSON" value="PERSON" />
          <el-option label="USER" value="USER" />
          <el-option label="AUTH" value="AUTH" />
        </el-select>

        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <!-- Table 
       v-loading ： 表格等组件专用的加载器
       stripe ：斑马纹，每行颜色交替
       style="margin-top: 16px" 定义行间距
       -->
      <el-table :data="tableData" v-loading="loading" stripe style="margin-top: 16px">
        <el-table-column prop="username" label="用户名" width="130" />
        <el-table-column prop="action" label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="actionTagType(row.action)">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourceType" label="资源类型" width="120" align="center" />
        <el-table-column prop="resourceName" label="资源名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="detail" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="时间" width="170" />
      </el-table>

      <!-- Pagination -->
      <div style="margin-top: 16px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { auditApi } from '../api/audit'

const loading = ref(false)
const exporting = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref(null)

const queryParams = reactive({
  action: '',
  resourceType: '',
  start: '',
  end: '',
  page: 1,
  size: 10
})

onMounted(() => loadData())

async function loadData() {
  if (dateRange.value) {
    queryParams.start = dateRange.value[0]
    queryParams.end = dateRange.value[1]
  } else {
    queryParams.start = ''
    queryParams.end = ''
  }

  loading.value = true
  try {
    const res = await auditApi.list(queryParams)
    tableData.value = res.data?.content || res.data?.records || res.data?.data || []
    total.value = res.data?.totalElements || 0
  } catch (e) {
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  dateRange.value = null
  queryParams.action = ''
  queryParams.resourceType = ''
  queryParams.page = 1
  loadData()
}

function actionTagType(action) {
  const map = {
    CERT_UPLOAD: 'success',
    CERT_UPDATE: 'warning',
    CERT_DELETE: 'danger',
    CERT_VIEW: 'info',
    CERT_DOWNLOAD: 'info',
    PERSON_CREATE: 'success',
    PERSON_UPDATE: 'warning',
    PERSON_DELETE: 'danger',
    USER_CREATE: 'success',
    USER_UPDATE: 'warning',
    USER_DELETE: 'danger',
    PASSWORD_CHANGE: 'warning',
    LOGIN: 'primary',
    LOGOUT: 'info',
    FILE_ADD: 'success',
    FILE_REPLACE: 'warning',
    FILE_DELETE: 'danger'
  }
  return map[action] || 'info'
}

async function handleExport() {
  exporting.value = true
  try {
    if (dateRange.value) {
      queryParams.start = dateRange.value[0]
      queryParams.end = dateRange.value[1]
    }
    const blob = await auditApi.exportExcel(queryParams)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().substring(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>
