<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElDialog, ElMessage, ElPagination, ElInput, ElSelect, ElOption } from 'element-plus'
import { useRouter } from 'vue-router'
import { getSchemas, deleteSchema as deleteSchemaApi } from '../services/schemaService'
import {BASE} from "../services/api.js";

const router = useRouter()
const schemas = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const deleteDialogVisible = ref(false)
const schemaToDelete = ref(null)
const searchQuery = ref('')
const resourceNameFilter = ref('')
const resourceNames = computed(() => {
  const names = new Set(schemas.value.map(schema => schema.resourceName))
  return Array.from(names)
})

// 获取Schema列表
const fetchSchemas = async () => {
  loading.value = true
  try {
    const response = await getSchemas({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      resourceName: resourceNameFilter.value
    })
    schemas.value = response.data
    total.value = response.total || response.data.length
  } catch (error) {
    ElMessage.error('获取Schema列表失败: ' + error.message)
    console.error('获取Schema列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理搜索和筛选
const handleSearch = () => {
  currentPage.value = 1
  fetchSchemas()
}

// 重置搜索和筛选
const resetSearch = () => {
  searchQuery.value = ''
  resourceNameFilter.value = ''
  currentPage.value = 1
  fetchSchemas()
}

// 删除Schema
const deleteSchema = async () => {
  try {
    await deleteSchemaApi(schemaToDelete.value.id)
    ElMessage.success('删除成功')
    fetchSchemas()
    deleteDialogVisible.value = false
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
    console.error('删除失败:', error)
  }
}

// 处理分页变化
const handlePageChange = (currentPageVal) => {
  currentPage.value = currentPageVal
  fetchSchemas()
}

// 处理页面大小变化
const handleSizeChange = (pageSizeVal) => {
  pageSize.value = pageSizeVal
  fetchSchemas()
}

// 编辑Schema
const editSchema = (id) => {
  router.push({ name: 'editSchema', params: { id } })
}

// 查看Schema数据
const viewSchemaData = (id) => {
  router.push({ name: 'dataTest', query: { schemaId: id } })
}

onMounted(() => {
  fetchSchemas()
})
</script>

<template>
  <div class="schema-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Schema管理</span>
          <el-button
            type="primary"
            size="small"
            @click="router.push({ name: 'createSchema' })"
          >
            新建Schema
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="schemas"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80"  show-overflow-tooltip/>
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="resourceName" label="资源名称" width="180" />
        <el-table-column prop="endpoint" label="资源请求接口" width="180" >
          <template #default="{ row }">
            <el-link :href="BASE+row.endpoint" target="_blank">{{ row.endpoint }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="数据条数" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewSchemaData(row.id)"
              style="margin-right: 5px"
            >
              测试数据
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="editSchema(row.id)"
              style="margin-right: 5px"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="() => {
                schemaToDelete = row
                deleteDialogVisible = true
              }"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
      :before-close="() => { deleteDialogVisible = false }"
    >
      <span>确定要删除Schema <strong>{{ schemaToDelete?.name }}</strong> 吗？此操作不可撤销。</span>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteSchema">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.schema-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-table {
  margin-top: 15px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .schema-list-container {
    padding: 10px;
  }

  .el-table-column {
    font-size: 12px;
  }

  .el-button {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
