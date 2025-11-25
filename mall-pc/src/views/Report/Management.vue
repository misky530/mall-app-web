<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit, Delete, View, Download, Printer, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 报表模板列表
const templates = ref([
  {
    id: 1,
    name: '交易明细报表',
    type: 'detail',
    category: '交易报表',
    description: '展示所有订单交易明细，支持多条件筛选',
    createTime: '2025-11-20 10:00:00',
    updateTime: '2025-11-25 14:30:00',
    status: 'published',
    icon: '📋',
    fields: ['订单号', '买家', '卖家', '金额', '状态', '时间']
  },
  {
    id: 2,
    name: '资金汇总报表',
    type: 'summary',
    category: '财务报表',
    description: '按状态汇总资金池金额，包含分组小计和总计',
    createTime: '2025-11-21 09:00:00',
    updateTime: '2025-11-24 16:00:00',
    status: 'published',
    icon: '💰',
    fields: ['状态', '笔数', '总金额', '平均金额']
  },
  {
    id: 3,
    name: '经办商工作量报表',
    type: 'summary',
    category: '业务报表',
    description: '统计经办商处理业务的数量和效率',
    createTime: '2025-11-22 11:00:00',
    updateTime: '2025-11-25 09:00:00',
    status: 'published',
    icon: '👤',
    fields: ['经办商', '确认数', '结算数', '仲裁数', '平均处理时长']
  },
  {
    id: 4,
    name: '时间趋势报表',
    type: 'chart',
    category: '分析报表',
    description: '按月统计交易趋势，包含图表和数据表',
    createTime: '2025-11-23 15:00:00',
    updateTime: '2025-11-25 10:00:00',
    status: 'draft',
    icon: '📈',
    fields: ['月份', '订单数', '交易额', '环比增长']
  },
  {
    id: 5,
    name: '交叉分析报表',
    type: 'crosstab',
    category: '分析报表',
    description: '状态×时间交叉分析，透视表形式',
    createTime: '2025-11-24 13:00:00',
    updateTime: '2025-11-25 11:00:00',
    status: 'draft',
    icon: '🔍',
    fields: ['行维度', '列维度', '数值']
  }
])

// 筛选条件
const searchKeyword = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')

// 分类列表
const categories = ['全部', '交易报表', '财务报表', '业务报表', '分析报表']

// 筛选后的模板
const filteredTemplates = computed(() => {
  return templates.value.filter(t => {
    const matchKeyword = !searchKeyword.value || 
      t.name.includes(searchKeyword.value) || 
      t.description.includes(searchKeyword.value)
    const matchCategory = !categoryFilter.value || 
      categoryFilter.value === '全部' || 
      t.category === categoryFilter.value
    const matchStatus = !statusFilter.value || t.status === statusFilter.value
    
    return matchKeyword && matchCategory && matchStatus
  })
})

// 新建报表
const handleCreate = () => {
  router.push('/report/designer')
}

// 设计报表
const handleDesign = (template) => {
  router.push({
    path: '/report/designer',
    query: { id: template.id }
  })
}

// 预览报表
const handlePreview = (template) => {
  router.push({
    path: '/report/preview',
    query: { id: template.id }
  })
}

// 复制模板
const handleCopy = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定复制报表 "${template.name}" 吗？`,
      '提示',
      { type: 'info' }
    )
    
    // 模拟复制
    const newTemplate = {
      ...template,
      id: templates.value.length + 1,
      name: template.name + ' (副本)',
      status: 'draft',
      createTime: new Date().toLocaleString('zh-CN')
    }
    templates.value.unshift(newTemplate)
    
    ElMessage.success('复制成功')
  } catch {
    // 用户取消
  }
}

// 删除模板
const handleDelete = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定删除报表 "${template.name}" 吗？此操作不可恢复。`,
      '警告',
      { type: 'warning' }
    )
    
    const index = templates.value.findIndex(t => t.id === template.id)
    templates.value.splice(index, 1)
    
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 导出模板
const handleExport = (template) => {
  const json = JSON.stringify(template, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${template.name}.json`
  link.click()
  
  ElMessage.success('导出成功')
}

// 状态徽章颜色
const getStatusType = (status) => {
  return status === 'published' ? 'success' : 'info'
}

const getStatusText = (status) => {
  return status === 'published' ? '已发布' : '草稿'
}

// 类型图标
const getTypeIcon = (type) => {
  const icons = {
    detail: '📋',
    summary: '📊',
    chart: '📈',
    crosstab: '🔍'
  }
  return icons[type] || '📄'
}

import { computed } from 'vue'
</script>

<template>
  <div class="report-management">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h1>专业报表系统</h1>
          <p class="subtitle">Professional Report Designer</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" size="large" @click="handleCreate">
            新建报表
          </el-button>
        </div>
      </div>

      <!-- 筛选栏 -->
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true">
          <el-form-item label="搜索">
            <el-input
              v-model="searchKeyword"
              placeholder="报表名称或描述"
              clearable
              style="width: 250px"
            >
              <template #prefix>
                <el-icon><i class="el-icon-search" /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="分类">
            <el-select v-model="categoryFilter" placeholder="全部分类" clearable style="width: 150px">
              <el-option
                v-for="cat in categories"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 报表模板列表 -->
      <div class="templates-grid">
        <el-card
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
          shadow="hover"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="template-icon">{{ template.icon }}</span>
              <div class="template-info">
                <h3>{{ template.name }}</h3>
                <span class="category-tag">{{ template.category }}</span>
              </div>
            </div>
            <el-tag :type="getStatusType(template.status)" size="small">
              {{ getStatusText(template.status) }}
            </el-tag>
          </div>
          
          <div class="card-body">
            <p class="description">{{ template.description }}</p>
            
            <div class="fields-list">
              <span class="field-label">字段：</span>
              <el-tag
                v-for="(field, index) in template.fields"
                :key="index"
                size="small"
                type="info"
                effect="plain"
              >
                {{ field }}
              </el-tag>
            </div>
            
            <div class="meta-info">
              <span>创建：{{ template.createTime }}</span>
              <span>更新：{{ template.updateTime }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <el-button-group>
              <el-button size="small" :icon="Edit" @click="handleDesign(template)">
                设计
              </el-button>
              <el-button size="small" :icon="View" @click="handlePreview(template)">
                预览
              </el-button>
              <el-button size="small" :icon="DocumentCopy" @click="handleCopy(template)">
                复制
              </el-button>
            </el-button-group>
            
            <el-dropdown trigger="click" @command="(cmd) => cmd(template)">
              <el-button size="small">
                更多 <el-icon class="el-icon--right"><i class="el-icon-arrow-down" /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Download" :command="handleExport">
                    导出模板
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Printer" disabled>
                    打印设置
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Delete" :command="handleDelete" divided>
                    删除模板
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="filteredTemplates.length === 0"
        description="暂无报表模板"
      >
        <el-button type="primary" @click="handleCreate">新建第一个报表</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.report-management {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.template-card {
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header .header-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.template-icon {
  font-size: 36px;
  line-height: 1;
}

.template-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #303133;
}

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 3px;
  font-size: 12px;
  color: #606266;
}

.card-body {
  margin-bottom: 15px;
}

.description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.fields-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
}

.field-label {
  font-size: 13px;
  color: #909399;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
