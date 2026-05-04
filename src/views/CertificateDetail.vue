<template>
  <div class="page-container">
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <div style="display: flex; align-items: center; gap: 12px">
            <el-button text @click="$router.push('/certificates')">
              <el-icon><ArrowLeft /></el-icon>返回列表
            </el-button>
            <span style="font-size: 16px; font-weight: bold">证书详情</span>
          </div>
          <div v-if="!detail?.deleted" style="display: flex; gap: 8px">
            <el-button type="warning" @click="$router.push(`/certificates/${route.params.id}/edit`)">编辑</el-button>
            <el-button type="success" @click="openDownload">下载</el-button>
            <el-button type="danger" @click="handleDelete">删除</el-button>
          </div>
        </div>
      </template>

      <el-alert v-if="detail?.deleted" type="warning" :closable="false" style="margin-bottom: 16px">
        此证书在回收站中，如需修改请先恢复。
      </el-alert>

      <el-tabs v-model="activeTab">
        <!-- Tab 1: Certificate Info -->
        <el-tab-pane label="证书信息" name="info">
          <el-descriptions :column="2" border v-if="detail">
            <el-descriptions-item label="证书名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="归属人">{{ detail.personName }}</el-descriptions-item>
            <el-descriptions-item label="证书类型">{{ certTypeLabel(detail.type) }}</el-descriptions-item>
            <el-descriptions-item label="状态"><StatusBadge :status="detail.status" /></el-descriptions-item>
            <el-descriptions-item label="颁发机构">{{ detail.issuer }}</el-descriptions-item>
            <el-descriptions-item label="证书编号">{{ detail.serialNumber }}</el-descriptions-item>
            <el-descriptions-item label="主题" :span="2">{{ detail.subject }}</el-descriptions-item>
            <el-descriptions-item label="生效时间">{{ formatDate(detail.validFrom) }}</el-descriptions-item>
            <el-descriptions-item label="失效时间">{{ formatDate(detail.validTo) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div v-else-if="loadError" style="text-align: center; padding: 60px 0; color: #909399">
            <el-icon style="font-size: 48px; margin-bottom: 16px"><Warning /></el-icon>
            <div style="font-size: 16px; margin-bottom: 8px">无法加载证书详情</div>
            <div style="font-size: 13px; color: #c0c4cc">您可能没有权限查看此证书，或证书不存在</div>
            <el-button type="primary" style="margin-top: 20px" @click="router.push('/certificates')">返回证书列表</el-button>
          </div>

          <!-- File Preview -->
          <div v-if="detail" style="margin-top: 24px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
              <span style="font-weight: bold">证书文件</span>
              <el-button v-if="!detail?.deleted" type="primary" size="small" @click="showUploadDialog">追加文件</el-button>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px">
              <el-tag v-if="detail.files?.some(f => f.fileType === 'JPG')" type="success" size="large">JPG 图片</el-tag>
              <el-tag v-if="detail.files?.some(f => f.fileType === 'PDF')" type="" size="large">PDF 文档</el-tag>
              <el-tag v-if="!detail.files?.some(f => f.fileType === 'JPG')" type="info" size="large" style="opacity: 0.5">JPG（未上传）</el-tag>
              <el-tag v-if="!detail.files?.some(f => f.fileType === 'PDF')" type="info" size="large" style="opacity: 0.5">PDF（未上传）</el-tag>
            </div>
            <div v-if="detail.files && detail.files.length > 0" style="display: flex; flex-direction: column; gap: 8px">
              <div v-for="file in detail.files" :key="file.fileType"
                style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid #eee; border-radius: 4px">
                <el-tag :type="file.fileType === 'JPG' ? 'success' : ''" size="small">{{ file.fileType }}</el-tag>
                <span style="flex: 1; font-size: 13px; color: #666">{{ file.originalFilename }}</span>
                <el-button type="primary" size="small" link @click="handlePreview(file.fileType)">预览</el-button>
                <el-button v-if="!detail?.deleted" type="danger" size="small" link @click="handleDeleteFile(file.fileType)">删除</el-button>
              </div>
            </div>
            <el-button v-if="detail.files && detail.files.length > 0" type="success" style="margin-top: 12px" @click="openDownload">
              下载
            </el-button>
          </div>
        </el-tab-pane>

        <!-- Tab 2: Change History -->
        <el-tab-pane label="变更记录" name="history">
          <el-table :data="historyList" v-loading="historyLoading" stripe style="width: 100%"
            :empty-text="loadError ? '无法加载变更记录' : '暂无变更记录'">
            <el-table-column prop="operator" label="操作人" min-width="120" />
            <el-table-column prop="createdAt" label="操作时间" min-width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="changeType" label="变更类型" min-width="120" />
            <el-table-column prop="detail" label="变更内容" min-width="240">
              <template #default="{ row }">
                <template v-if="row.changeType === 'CREATE' || row.changeType === 'DELETE'">
                  <span style="font-size: 13px">{{ row.detail }}</span>
                  <div v-if="row.changeType === 'DELETE' && parseCertSnapshot(row.oldValue)" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px">
                    <span v-for="file in parseCertSnapshot(row.oldValue).files" :key="file.fileType"
                      style="display: flex; align-items: center; gap: 4px; font-size: 13px">
                      <el-tag size="small" type="danger">{{ file.fileType }}</el-tag>
                      <span style="color: #999">{{ file.originalFilename }}</span>
                      <el-button type="warning" size="small" link
                        @click="handlePreviewDeletedCert(row.id, file.fileType)">预览</el-button>
                    </span>
                  </div>
                </template>
                <div v-else-if="row.changeType === 'FILE_ADD'" style="display: flex; flex-direction: column; gap: 4px">
                  <span v-if="parseFileChange(row.detail)" style="font-size: 13px">
                    追加 <el-tag size="small">{{ parseFileChange(row.detail).fileType }}</el-tag> 文件:
                    {{ parseFileChange(row.detail).filename }}
                  </span>
                  <span v-else>{{ row.detail }}</span>
                  <el-button
                    v-if="row.newFilePath"
                    type="success"
                    size="small"
                    link
                    @click="handlePreviewHistory(row.id, 'new')"
                  >
                    预览
                  </el-button>
                </div>
                <div v-else-if="row.changeType === 'FILE_DELETE'" style="display: flex; flex-direction: column; gap: 4px">
                  <span v-if="parseFileChange(row.detail)" style="font-size: 13px">
                    删除 <el-tag size="small" type="danger">{{ parseFileChange(row.detail).fileType }}</el-tag> 文件:
                    {{ parseFileChange(row.detail).filename }}
                  </span>
                  <span v-else>{{ row.detail }}</span>
                  <el-button
                    v-if="row.oldFilePath"
                    type="primary"
                    size="small"
                    link
                    @click="handlePreviewHistory(row.id, 'old')"
                  >
                    预览已删除文件
                  </el-button>
                </div>
                <div v-else-if="row.changeType === 'UPDATE'" style="display: flex; flex-direction: column; gap: 4px">
                  <span v-for="(change, field) in parseChanges(row.detail)" :key="field" style="font-size: 13px">
                    <span style="color: #67c23a">{{ FIELD_LABELS[field] || field }}</span>:
                    {{ change[0] }} → {{ change[1] }}
                  </span>
                </div>
                <div v-else-if="row.changeType === 'FILE_REPLACE'">
                  <span v-if="parseFileReplace(row.detail)" style="font-size: 13px">
                    替换 <el-tag size="small">{{ parseFileReplace(row.detail).fileType }}</el-tag> 文件:
                    {{ parseFileReplace(row.detail).oldFilename }}
                    →
                    {{ parseFileReplace(row.detail).newFilename }}
                  </span>
                  <span v-else>{{ row.detail }}</span>
                  <div style="display: flex; gap: 8px; margin-top: 4px">
                    <el-button
                      v-if="row.oldFilePath"
                      type="primary"
                      size="small"
                      link
                      @click="handlePreviewHistory(row.id, 'old')"
                    >
                      预览旧文件
                    </el-button>
                    <el-button
                      v-if="row.newFilePath"
                      type="success"
                      size="small"
                      link
                      @click="handlePreviewHistory(row.id, 'new')"
                    >
                      预览新文件
                    </el-button>
                  </div>
                </div>
                <span v-else>{{ row.detail }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <span v-if="row.changeType !== 'FILE_REPLACE'"></span>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="historyTotal > 0"
            background
            layout="prev, pager, next"
            :total="historyTotal"
            :page-size="historySize"
            :current-page="historyPage"
            @current-change="handleHistoryPageChange"
            style="margin-top: 16px; justify-content: flex-end"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- Preview Dialog -->
      <FilePreview v-model="previewVisible" :blob="previewBlob" :file-name="previewFileName" />

      <!-- Download Dialog -->
      <DownloadDialog v-model="downloadVisible" :cert="downloadCert" />

      <!-- Upload File Dialog -->
      <el-dialog v-if="detail" v-model="uploadVisible" title="追加证书文件" width="400px">
        <div style="margin-bottom: 16px">
          <div style="font-size: 13px; color: #666; margin-bottom: 12px">
            选择要上传的文件类型（已有文件会被覆盖）：
          </div>
          <el-radio-group v-model="uploadFileType">
            <el-radio label="JPG" :disabled="!!detail.files?.some(f => f.fileType === 'JPG')">JPG 图片</el-radio>
            <el-radio label="PDF" :disabled="!!detail.files?.some(f => f.fileType === 'PDF')">PDF 文档</el-radio>
          </el-radio-group>
        </div>
        <el-upload
          ref="uploadFileRef"
          :auto-upload="false"
          :limit="1"
          :accept="uploadFileType === 'JPG' ? '.jpg,.jpeg,.png' : '.pdf'"
          :on-change="handleUploadFileChange"
          drag
        >
          <el-icon style="font-size: 40px; color: var(--brand-primary)"><UploadFilled /></el-icon>
          <div style="margin-top: 8px; color: #606266">
            点击或拖拽上传 {{ uploadFileType === 'JPG' ? 'JPG/PNG 图片' : 'PDF 文件' }}
          </div>
        </el-upload>
        <template #footer>
          <el-button @click="uploadVisible = false">取消</el-button>
          <el-button type="primary" :loading="uploading" @click="handleUploadFile">上传</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import { personApi } from '../api/person'
import StatusBadge from '../components/StatusBadge.vue'
import FilePreview from '../components/FilePreview.vue'
import DownloadDialog from '../components/DownloadDialog.vue'
import { certTypeLabel } from '../utils/certType'
import { UploadFilled, Warning, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeTab = ref('info')

const loading = ref(false)
const detail = ref(null)
const persons = ref([])
const loadError = ref(false)
const previewVisible = ref(false)
const previewBlob = ref(null)
const previewFileName = ref('')
const downloadVisible = ref(false)
const downloadCert = ref(null)
const uploadVisible = ref(false)
const uploadFileType = ref('JPG')
const uploadFileRef = ref(null)
const uploadFile = ref(null)
const uploading = ref(false)

const historyLoading = ref(false)
const historyList = ref([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historySize = ref(10)

onMounted(async () => {
  await Promise.all([loadDetail(), loadPersons()])
})

watch(activeTab, (tab) => { if (tab === 'history') loadHistory() })

async function loadPersons() {
  try {
    const res = await personApi.list({ size: 1000 })
    persons.value = res.data?.content || res.data?.records || res.data?.data || []
  } catch (e) {
    persons.value = []
  }
}

async function loadDetail() {
  loading.value = true
  loadError.value = false
  try {
    const res = await certificateApi.getById(route.params.id)
    const cert = res.data
    if (cert) {
      const personName = persons.value.find(p => p.id === cert.personId)?.name || cert.personId
      detail.value = { ...cert, personName }
    } else {
      loadError.value = true
    }
  } catch (e) {
    loadError.value = true
    ElMessage.error('加载失败: ' + (e.response?.status === 403 ? '无权访问' : e.message))
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await certificateApi.getChangeHistory(route.params.id, {
      page: historyPage.value,
      size: historySize.value
    })
    const data = res.data?.data || res.data
    historyList.value = data?.content || data?.records || []
    historyTotal.value = data?.totalElements || data?.total || 0
  } catch (e) {
    historyList.value = []
    historyTotal.value = 0
  } finally {
    historyLoading.value = false
  }
}

function handleHistoryPageChange(page) {
  historyPage.value = page
  loadHistory()
}

async function handlePreviewHistory(historyId, version = 'old') {
  try {
    const row = historyList.value.find(h => h.id === historyId)
    const blob = version === 'new'
      ? await certificateApi.previewHistoryNewFile(historyId)
      : await certificateApi.previewHistoryFile(historyId)
    const fileInfo = parseFileReplace(row?.detail)
    // FILE_REPLACE uses oldFilename/newFilename, FILE_ADD/FILE_DELETE use filename
    let name = version === 'new'
      ? (fileInfo?.newFilename || fileInfo?.filename)
      : (fileInfo?.oldFilename || fileInfo?.filename)
    // Fall back to extracting filename from the stored file path
    if (!name) {
      const filePath = version === 'new' ? row?.newFilePath : row?.oldFilePath
      if (filePath) {
        const lastSep = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
        name = lastSep >= 0 ? filePath.substring(lastSep + 1) : filePath
      }
    }
    previewBlob.value = blob
    previewFileName.value = name || `file_${historyId}`
    previewVisible.value = true
  } catch (e) {
    ElMessage.error('预览快照失败')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.substring(0, 16).replace('T', ' ')
}

const FIELD_LABELS = {
  personId: '归属人',
  name: '证书名称',
  type: '证书类型',
  issuer: '颁发机构',
  serialNumber: '证书编号',
  subject: '主题',
  validFrom: '生效时间',
  validTo: '失效时间',
  description: '备注',
  status: '状态'
}

function parseChanges(detail) {
  if (!detail) return {}
  try {
    const obj = typeof detail === 'string' ? JSON.parse(detail) : detail
    return obj.changes || {}
  } catch {
    return {}
  }
}

function parseFileReplace(detail) {
  if (!detail) return null
  try {
    const obj = typeof detail === 'string' ? JSON.parse(detail) : detail
    return obj
  } catch {
    return null
  }
}

function parseFileChange(detail) {
  return parseFileReplace(detail)
}

function parseCertSnapshot(oldValue) {
  if (!oldValue) return null
  try {
    const obj = typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue
    return obj
  } catch {
    return null
  }
}

async function handlePreviewDeletedCert(historyId, fileType) {
  try {
    const blob = await certificateApi.previewHistoryFile(historyId)
    const row = historyList.value.find(h => h.id === historyId)
    const certSnapshot = parseCertSnapshot(row?.oldValue)
    let name = ''
    if (certSnapshot?.files) {
      const file = certSnapshot.files.find(f => f.fileType === fileType)
      name = file?.originalFilename || ''
    }
    previewBlob.value = blob
    previewFileName.value = name || `${fileType}_deleted.${fileType.toLowerCase()}`
    previewVisible.value = true
  } catch (e) {
    ElMessage.error('预览已删除文件失败')
  }
}

async function handlePreview(fileType) {
  try {
    const blob = await certificateApi.preview(route.params.id, fileType)
    const file = detail.value?.files?.find(f => f.fileType === fileType)
    previewBlob.value = blob
    previewFileName.value = file?.originalFilename || `preview.${fileType.toLowerCase()}`
    previewVisible.value = true
  } catch (e) {
    ElMessage.error('预览失败')
  }
}

function openDownload() {
  downloadCert.value = detail.value
  downloadVisible.value = true
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(`确定删除证书「${detail.value?.name}」吗？`, '删除确认', { type: 'warning' })
    await certificateApi.remove(route.params.id)
    ElMessage.success('删除成功')
    router.push('/certificates')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

async function handleDeleteFile(fileType) {
  try {
    await ElMessageBox.confirm(`确定删除 ${fileType} 文件吗？`, '删除确认', { type: 'warning' })
    await certificateApi.removeFile(route.params.id, fileType)
    ElMessage.success('删除成功')
    await loadDetail()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

function showUploadDialog() {
  const hasJpg = !!detail.value.files?.some(f => f.fileType === 'JPG')
  const hasPdf = !!detail.value.files?.some(f => f.fileType === 'PDF')
  uploadFileType.value = hasJpg ? 'PDF' : 'JPG'
  uploadFile.value = null
  if (uploadFileRef.value) {
    uploadFileRef.value.clearFiles()
  }
  uploadVisible.value = true
}

function handleUploadFileChange(fileItem) {
  uploadFile.value = fileItem.raw
}

async function handleUploadFile() {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  uploading.value = true
  try {
    await certificateApi.addFile(route.params.id, uploadFile.value)
    ElMessage.success('上传成功')
    uploadVisible.value = false
    await loadDetail()
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}
</script>
