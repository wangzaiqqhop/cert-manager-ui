<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">证书列表</span>
          <div style="display: flex; gap: 8px">
            <el-button type="success" @click="openImportDialog">
              <el-icon style="margin-right: 4px"><Download /></el-icon>批量导入
            </el-button>
            <el-button type="warning" @click="openFileUploadDialog">
              <el-icon style="margin-right: 4px"><Upload /></el-icon>批量上传文件
            </el-button>
            <el-button type="primary" @click="$router.push('/certificates/upload')">
              <el-icon style="margin-right: 4px"><Upload /></el-icon>上传证书
            </el-button>
          </div>
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

      <!-- 快捷筛选 -->
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <el-button :type="quickFilter === '' ? 'primary' : ''" size="small" @click="setQuickFilter('')">全部</el-button>
        <el-button :type="quickFilter === 'month' ? 'primary' : ''" size="small" @click="setQuickFilter('month')">本月到期</el-button>
        <el-button :type="quickFilter === '30days' ? 'primary' : ''" size="small" @click="setQuickFilter('30days')">30天内到期</el-button>
        <el-button :type="quickFilter === 'expired' ? 'primary' : ''" size="small" @click="setQuickFilter('expired')">已过期</el-button>
      </div>

      <!-- Table -->
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="证书名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="personName" label="归属人" width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="证书类型" width="120">
          <template #default="{ row }">{{ certTypeLabel(row.type) }}</template>
        </el-table-column>
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
        <el-table-column prop="uploaderName" label="上传人" width="100" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="warning" size="small" link @click="$router.push(`/certificates/${row.id}/edit`)">编辑</el-button>
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

    <!-- 批量文件上传对话框 -->
    <el-dialog v-model="fileUploadVisible" title="批量上传文件（命名匹配）" width="600px" destroy-on-close>
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        <template #title>
          文件按 "人员编号_证书名称.ext" 命名 → 系统自动匹配证书并关联文件
        </template>
      </el-alert>

      <el-upload
        ref="fileUploadRef"
        :auto-upload="false"
        multiple
        accept=".jpg,.jpeg,.png,.pdf"
        :on-change="handleFilesChange"
        :on-remove="handleFileRemove"
        drag
      >
        <el-icon style="font-size: 36px; color: #409eff"><Upload /></el-icon>
        <div style="margin-top: 8px">将扫描件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div style="margin-top: 4px; font-size: 12px; color: #909399">
            示例：GH001_安全员证书.pdf → 自动匹配到张三的安全员证书
          </div>
        </template>
      </el-upload>

      <div v-if="fileMatchResult" style="margin-top: 16px">
        <el-alert
          :type="fileMatchResult.skipped > 0 || fileMatchResult.details?.some(d => d.status === 'error') ? 'warning' : 'success'"
          :closable="false"
        >
          <template #title>
            共 {{ fileMatchResult.total }} 个文件，匹配 {{ fileMatchResult.matched }} 个，跳过 {{ fileMatchResult.skipped }} 个
          </template>
        </el-alert>
        <div style="margin-top: 8px; max-height: 200px; overflow-y: auto">
          <div v-for="(d, i) in fileMatchResult.details" :key="i" style="font-size: 13px; line-height: 1.8"
               :style="{ color: d.status === 'matched' ? '#67c23a' : d.status === 'skipped' ? '#e6a23c' : '#f56c6c' }">
            {{ d.filename }}  {{ d.message }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="fileUploadVisible = false">关闭</el-button>
        <el-button type="primary" :loading="uploadingFiles" :disabled="uploadFilesList.length === 0" @click="handleUploadFiles">
          开始匹配上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importVisible" title="批量导入证书" width="550px" destroy-on-close>
      <!-- Step 1: 下载模板 -->
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        <template #title>
          1. 下载 Excel 模板 → 2. 按模板格式填写数据 → 3. 上传文件导入
        </template>
      </el-alert>

      <div style="margin-bottom: 16px">
        <el-button type="primary" @click="handleDownloadTemplate" :loading="downloadingTpl" link>
          <el-icon style="margin-right: 4px"><Download /></el-icon>下载导入模板
        </el-button>
      </div>

      <!-- Step 2: 上传文件 -->
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-remove="() => importFile = null"
        drag
      >
        <el-icon style="font-size: 36px; color: #409eff"><Upload /></el-icon>
        <div style="margin-top: 8px">将填好的 Excel 文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div style="margin-top: 4px; font-size: 12px; color: #909399">
            仅支持 .xlsx / .xls 格式，表头请勿修改
          </div>
        </template>
      </el-upload>

      <!-- 导入结果 -->
      <div v-if="importResult" style="margin-top: 16px">
        <el-alert
          :type="importResult.errors?.length ? 'warning' : 'success'"
          :closable="false"
        >
          <template #title>
            共 {{ importResult.total }} 条，成功 {{ importResult.success }} 条
            <span v-if="importResult.errors?.length">，失败 {{ importResult.errors.length }} 条</span>
          </template>
        </el-alert>
        <div v-if="importResult.errors?.length" style="margin-top: 8px; max-height: 160px; overflow-y: auto">
          <div v-for="(err, i) in importResult.errors" :key="i" style="font-size: 13px; color: #e6a23c; line-height: 1.8">
            第 {{ err.row }} 行：{{ err.message }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="importVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importing" :disabled="!importFile" @click="handleImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import { personApi } from '../api/person'
import StatusBadge from '../components/StatusBadge.vue'
import DownloadDialog from '../components/DownloadDialog.vue'
import { certTypeLabel } from '../utils/certType'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const persons = ref([])
const downloadVisible = ref(false)
const downloadCert = ref(null)

// 批量导入
const importVisible = ref(false)
const importing = ref(false)
const downloadingTpl = ref(false)
const importFile = ref(null)
const importResult = ref(null)
const uploadRef = ref(null)

// 批量文件上传
const fileUploadVisible = ref(false)
const uploadingFiles = ref(false)
const uploadFilesList = ref([])
const fileMatchResult = ref(null)
const fileUploadRef = ref(null)

const queryParams = reactive({
  keyword: '',
  personId: null,
  status: '',
  validToStart: '',
  validToEnd: '',
  page: 1,
  size: 10
})
const quickFilter = ref('')

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
  quickFilter.value = ''
  queryParams.keyword = ''
  queryParams.personId = null
  queryParams.status = ''
  queryParams.validToStart = ''
  queryParams.validToEnd = ''
  queryParams.page = 1
  loadData()
}

function setQuickFilter(filter) {
  quickFilter.value = filter
  queryParams.page = 1
  const now = new Date()
  const todayStr = now.toISOString().substring(0, 10)

  if (filter === 'month') {
    // 本月到期
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    queryParams.validToStart = todayStr
    queryParams.validToEnd = lastDay.toISOString().substring(0, 10)
    queryParams.status = ''
  } else if (filter === '30days') {
    // 30天内到期
    const future = new Date(now.getTime() + 30 * 86400000)
    queryParams.validToStart = todayStr
    queryParams.validToEnd = future.toISOString().substring(0, 10)
    queryParams.status = ''
  } else if (filter === 'expired') {
    queryParams.validToStart = ''
    queryParams.validToEnd = todayStr
    queryParams.status = ''
  } else {
    queryParams.validToStart = ''
    queryParams.validToEnd = ''
    queryParams.status = ''
  }
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

// 批量导入
function openImportDialog() {
  importResult.value = null
  importFile.value = null
  importVisible.value = true
}

function handleFileChange(file) {
  importFile.value = file.raw
  importResult.value = null
}

async function handleDownloadTemplate() {
  downloadingTpl.value = true
  try {
    const blob = await certificateApi.downloadTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'certificate-import-template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('模板下载失败')
  } finally {
    downloadingTpl.value = false
  }
}

async function handleImport() {
  if (!importFile.value) return
  importing.value = true
  try {
    const res = await certificateApi.importExcel(importFile.value)
    importResult.value = res.data
    if (!importResult.value.errors?.length) {
      ElMessage.success(`成功导入 ${importResult.value.success} 条记录`)
      loadData()
    }
  } catch (e) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

// 批量文件上传
function openFileUploadDialog() {
  fileMatchResult.value = null
  uploadFilesList.value = []
  fileUploadVisible.value = true
}

function handleFilesChange(file) {
  uploadFilesList.value.push(file.raw)
}

function handleFileRemove(file) {
  const idx = uploadFilesList.value.indexOf(file.raw)
  if (idx >= 0) uploadFilesList.value.splice(idx, 1)
}

async function handleUploadFiles() {
  if (uploadFilesList.value.length === 0) return
  uploadingFiles.value = true
  try {
    const res = await certificateApi.importFiles(uploadFilesList.value)
    fileMatchResult.value = res.data
    if (fileMatchResult.value?.matched > 0) {
      ElMessage.success(`成功匹配 ${fileMatchResult.value.matched} 个文件`)
      loadData()
    } else {
      ElMessage.warning('没有文件被匹配，请检查文件名格式')
    }
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    uploadingFiles.value = false
  }
}
</script>
