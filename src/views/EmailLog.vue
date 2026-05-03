<template>
  <div class="page-container">
    <el-card>
      <template #header><span style="font-size:16px;font-weight:bold">邮件发送日志</span></template>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="recipientName" label="收件人" width="100" />
        <el-table-column prop="recipientEmail" label="收件邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="senderEmail" label="发件人" width="180" show-overflow-tooltip />
        <el-table-column prop="reminderDate" label="提醒日期" width="110" />
        <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="sent" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="!row.sent && row.errorMessage" :content="row.errorMessage" placement="top">
              <el-tag type="danger" size="small">失败</el-tag>
            </el-tooltip>
            <el-tag v-else :type="row.sent ? 'success' : 'danger'" size="small">{{ row.sent ? '已发送' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sentAt" label="发送时间" width="160" />
      </el-table>
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination
          v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next"
          @size-change="loadData" @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { certificateApi } from '../api/certificate'
const loading = ref(false), tableData = ref([]), total = ref(0), page = ref(1), size = ref(10)
onMounted(() => loadData())
async function loadData() {
  loading.value = true
  try {
    const res = await certificateApi.emailLogs({ page: page.value, size: size.value })
    tableData.value = res.data?.content || res.data?.records || res.data?.data || []
    total.value = res.data?.totalElements || 0
  } catch(e) {} finally { loading.value = false }
}
</script>
