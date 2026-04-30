<template>
  <el-dialog v-model="visible" title="文件预览" width="800px" destroy-on-close>
    <div style="text-align: center; min-height: 500px; display: flex; align-items: center; justify-content: center">
      <iframe v-if="fileType === 'pdf'" :src="blobUrl" style="width: 100%; height: 600px; border: none" />
      <img v-else-if="isImage" :src="blobUrl" style="max-width: 100%; max-height: 600px; object-fit: contain" />
      <div v-else style="color: #999; font-size: 14px">不支持预览此文件类型</div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  blob: {
    type: Blob,
    default: null
  },
  fileName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const blobUrl = ref('')

watch([() => props.blob, () => props.modelValue], ([blob, show]) => {
  if (show && blob) {
    blobUrl.value = URL.createObjectURL(blob)
  }
}, { immediate: true })

watch(visible, val => {
  if (!val) {
    if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = ''
  }
})

const fileType = computed(() => {
  // Try file extension first
  if (props.fileName) {
    const ext = props.fileName.split('.').pop().toLowerCase()
    if (ext && (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext))) {
      return ext
    }
  }
  // Fall back to blob MIME type (from Content-Type response header)
  if (props.blob && props.blob.type) {
    const mime = props.blob.type
    if (mime === 'application/pdf') return 'pdf'
    if (mime.startsWith('image/')) return mime.split('/')[1]
  }
  return ''
})

const isImage = computed(() => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType.value))
</script>
