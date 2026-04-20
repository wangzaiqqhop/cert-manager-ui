<template>
  <div class="page-container">
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">证书详情</span>
          <div style="display: flex; gap: 8px">
            <el-button type="success" @click="openDownload">下载</el-button>
            <el-button type="danger" @click="handleDelete">删除</el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="证书名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="归属人">{{ detail.personName }}</el-descriptions-item>
        <el-descriptions-item label="证书类型">{{ detail.type }}</el-descriptions-item>
        <el-descriptions-item label="状态"><StatusBadge :status="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="颁发机构">{{ detail.issuer }}</el-descriptions-item>
        <el-descriptions-item label="证书编号">{{ detail.serialNumber }}</el-descriptions-item>
        <el-descriptions-item label="主题" :span="2">{{ detail.subject }}</el-descriptions-item>
        <el-descriptions-item label="生效时间">{{ formatDate(detail.validFrom) }}</el-descriptions-item>
        <el-descriptions-item label="失效时间">{{ formatDate(detail.validTo) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- File Preview -->
      <div style="margin-top: 24px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
          <span style="font-weight: bold">证书文件</span>
          <el-button type="primary" size="small" @click="showUploadDialog">追加文件</el-button>
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
            <el-button type="danger" size="small" link @click="handleDeleteFile(file.fileType)">删除</el-button>
          </div>
        </div>
        <el-button v-if="detail.files && detail.files.length > 0" type="success" style="margin-top: 12px" @click="openDownload">
          下载
        </el-button>
      </div>

      <!-- Preview Dialog -->
      <FilePreview v-model="previewVisible" :blob="previewBlob" :file-name="previewFileName" />

      <!-- Download Dialog -->
      <DownloadDialog v-model="downloadVisible" :cert="downloadCert" />

      <!-- Upload File Dialog -->
      <el-dialog v-model="uploadVisible" title="追加证书文件" width="400px">
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
          <el-icon style="font-size: 40px; color: #409eff"><UploadFilled /></el-icon>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import StatusBadge from '../components/StatusBadge.vue'
import FilePreview from '../components/FilePreview.vue'
import DownloadDialog from '../components/DownloadDialog.vue'
import { UploadFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)
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

onMounted(() => {
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  try {
    const res = await certificateApi.getById(route.params.id)
    detail.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
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
