<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">证书列表</span>
          <el-button type="primary" @click="$router.push('/certificates/upload')">
            <el-icon style="margin-right: 4px"><Upload /></el-icon>上传证书
          </el-button>
        </div>
      </template>

      <!-- Search & Filter Toolbar -->
      <div class="toolbar" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索证书名称"
          style="width: 200px"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select v-model="queryParams.personId" placeholder="归属人" clearable style="width: 180px" @change="loadData">
          <el-option v-for="p in persons" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>

        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 150px" @change="loadData">
          <el-option label="有效" value="VALID" />
          <el-option label="即将过期" value="EXPIRING_SOON" />
          <el-option label="已过期" value="EXPIRED" />
          <el-option label="已撤销" value="REVOKED" />
        </el-select>

        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <!-- Table -->
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="证书名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="personName" label="归属人" width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="证书类型" width="120" />
        <el-table-column prop="issuer" label="颁发机构" min-width="140" show-overflow-tooltip />
        <el-table-column prop="subject" label="主题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="validTo" label="到期时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.validTo) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="文件" width="120" align="center">
          <template #default="{ row }">
            <span v-if="!row.files || row.files.length === 0">
              <el-tag type="info" size="small">无</el-tag>
            </span>
            <span v-else style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap">
              <el-tag v-if="row.files.some(f => f.fileType === 'JPG')" type="success" size="small">JPG</el-tag>
              <el-tag v-if="row.files.some(f => f.fileType === 'PDF')" type="" size="small">PDF</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/certificates/${row.id}`)">查看</el-button>
            <el-button type="success" size="small" link @click="openDownload(row)">下载</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
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

      <DownloadDialog v-model="downloadVisible" :cert="downloadCert" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import { personApi } from '../api/person'
import StatusBadge from '../components/StatusBadge.vue'
import DownloadDialog from '../components/DownloadDialog.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const persons = ref([])
const downloadVisible = ref(false)
const downloadCert = ref(null)

const queryParams = reactive({
  keyword: '',
  personId: null,
  status: '',
  page: 1,
  size: 10
})

onMounted(async () => {
  await loadPersons()
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await certificateApi.list(queryParams)
    const list = res.data?.content || res.data?.records || res.data?.data || []
    tableData.value = list.map(c => ({
      ...c,
      personName: persons.value.find(p => p.id === c.personId)?.name || c.personId
    }))
    total.value = res.data?.totalElements || 0
  } catch (e) {
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
}

async function loadPersons() {
  try {
    const res = await personApi.list({ size: 1000 })
    persons.value = res.data?.content || res.data?.records || res.data?.data || []
  } catch (e) {
    // ignore
  }
}

function resetQuery() {
  queryParams.keyword = ''
  queryParams.personId = null
  queryParams.status = ''
  queryParams.page = 1
  loadData()
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
}

function openDownload(cert) {
  downloadCert.value = cert
  downloadVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除证书「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await certificateApi.remove(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}
</script>
