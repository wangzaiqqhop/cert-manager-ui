<template>
  <div class="page-container">
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">证书详情</span>
          <div style="display: flex; gap: 8px">
            <el-button type="success" @click="handleDownload">下载</el-button>
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
        <div style="font-weight: bold; margin-bottom: 12px">证书文件预览</div>
        <el-button type="primary" @click="handlePreview">预览文件</el-button>
      </div>
    </el-card>

    <!-- Preview Dialog -->
    <FilePreview v-model="previewVisible" :blob="previewBlob" :file-name="previewFileName" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { certificateApi } from '../api/certificate'
import StatusBadge from '../components/StatusBadge.vue'
import FilePreview from '../components/FilePreview.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)
const previewVisible = ref(false)
const previewBlob = ref(null)
const previewFileName = ref('')

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

async function handlePreview() {
  try {
    const blob = await certificateApi.preview(route.params.id)
    previewBlob.value = blob
    previewFileName.value = detail.value?.originalFilename || 'preview.pdf'
    previewVisible.value = true
  } catch (e) {
    ElMessage.error('预览失败')
  }
}

async function handleDownload() {
  try {
    const blob = await certificateApi.download(route.params.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = detail.value?.name + (detail.value?.originalFilename ? detail.value.originalFilename.substring(detail.value.originalFilename.lastIndexOf('.')) : '.pdf')
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (e) {
    ElMessage.error('下载失败')
  }
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
</script>
