<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 16px; font-weight: bold">归属人管理</span>
          <el-button type="primary" @click="openDialog('create')">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>新建
          </el-button>
        </div>
      </template>

      <!-- Table -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="personNo" label="人员编号" width="140" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="department" label="部门" min-width="140" />
        <el-table-column prop="position" label="岗位" min-width="140" />
        <el-table-column prop="hireDate" label="入职日期" width="120" />
        <el-table-column prop="description" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openDialog('edit', row)">编辑</el-button>
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
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="人员编号" prop="personNo">
          <el-input v-model="form.personNo" placeholder="请输入人员编号" clearable />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入部门" clearable />
        </el-form-item>
        <el-form-item label="岗位" prop="position">
          <el-input v-model="form.position" placeholder="请输入岗位" clearable />
        </el-form-item>
        <el-form-item label="入职日期" prop="hireDate">
          <el-date-picker v-model="form.hireDate" type="date" placeholder="选择入职日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { personApi } from '../api/person'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const editId = ref(null)

const queryParams = reactive({ page: 1, size: 10 })

const form = reactive({
  personNo: '', name: '', department: '', position: '', hireDate: '', description: ''
})

const rules = {
  personNo: [{ required: true, message: '请输入人员编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const dialogTitle = computed(() => editId.value ? '编辑归属人' : '新建归属人')

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res = await personApi.list(queryParams)
    tableData.value = res.data?.content || res.data?.records || res.data?.data || []
    total.value = res.data?.totalElements || 0
  } catch (e) {
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
}

function openDialog(mode, row = {}) {
  if (mode === 'edit') {
    editId.value = row.id
    Object.assign(form, { personNo: row.personNo, name: row.name, department: row.department, position: row.position, hireDate: row.hireDate, description: row.description })
  } else {
    editId.value = null
    Object.assign(form, { personNo: '', name: '', department: '', position: '', hireDate: '', description: '' })
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (editId.value) {
      await personApi.update(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await personApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    // handled by axios interceptor
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await personApi.remove(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}
</script>
