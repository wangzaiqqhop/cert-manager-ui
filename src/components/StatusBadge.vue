<template>
  <el-tag :type="type" size="small" effect="plain">{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const label = computed(() => {
  const map = {
    VALID: '有效',
    EXPIRING_SOON: '即将过期',
    EXPIRED: '已过期',
    REVOKED: '已撤销'
  }
  return map[props.status] || props.status
})

const type = computed(() => {
  const map = {
    VALID: 'success',
    EXPIRING_SOON: 'warning',
    EXPIRED: 'danger',
    REVOKED: 'info'
  }
  return map[props.status] || 'info'
})
</script>
