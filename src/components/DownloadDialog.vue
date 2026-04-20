<template>
  <el-dialog v-model="visible" title="下载证书" width="440px" :close-on-click-modal="false">
    <div v-if="cert">
      <div style="margin-bottom: 16px">
        <span style="font-weight: bold">证书名称：</span>
        <span>{{ cert.name }}</span>
      </div>

      <div style="margin-bottom: 16px">
        <div style="font-weight: bold; margin-bottom: 8px">选择文件类型：</div>
        <el-checkbox-group v-model="selectedTypes">
          <el-checkbox v-if="hasFile('JPG')" label="JPG" value="JPG">
            JPG — {{ getFile('JPG')?.originalFilename }}
          </el-checkbox>
          <el-checkbox v-if="hasFile('PDF')" label="PDF" value="PDF">
            PDF — {{ getFile('PDF')?.originalFilename }}
          </el-checkbox>
        </el-checkbox-group>
        <div v-if="selectedTypes.length === 0" style="color: #909399; font-size: 13px">
          该证书暂无文件
        </div>
      </div>

      <div>
        <div style="font-weight: bold; margin-bottom: 8px">水印文字（可选）：</div>
        <el-input
          v-model="watermarkText"
          type="textarea"
          :rows="2"
          placeholder="如：办理居住证使用"
          maxlength="200"
          show-word-limit
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="downloading" @click="handleConfirm" :disabled="selectedTypes.length === 0">
        确认下载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { certificateApi } from '../api/certificate'

const props = defineProps({
  modelValue: Boolean,
  cert: Object  // { id, name, files: [{fileType, originalFilename}] }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const selectedTypes = ref([])
const watermarkText = ref('')
const downloading = ref(false)

watch(visible, val => {
  if (val) {
    selectedTypes.value = props.cert?.files?.length
      ? props.cert.files.map(f => f.fileType)
      : []
    watermarkText.value = ''
  }
})

function hasFile(type) {
  return props.cert?.files?.some(f => f.fileType === type)
}

function getFile(type) {
  return props.cert?.files?.find(f => f.fileType === type)
}

async function handleConfirm() {
  if (selectedTypes.value.length === 0) {
    ElMessage.warning('请至少选择一个文件类型')
    return
  }
  downloading.value = true
  let hasError = false
  try {
    for (const type of selectedTypes.value) {
      try {
        const blob = await certificateApi.download(
          props.cert.id,
          type,
          watermarkText.value || null
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const originalFile = getFile(type)
        a.download = (originalFile?.originalFilename) || (`${props.cert.name}.${type.toLowerCase()}`)
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        hasError = true
        console.error(`下载 ${type} 失败:`, e)
      }
    }
    if (hasError) {
      ElMessage.error('部分文件下载失败')
    } else {
      ElMessage.success('下载成功')
    }
  } finally {
    downloading.value = false
    visible.value = false
  }
}
</script>
