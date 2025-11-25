<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Plus, Delete, Setting, View, Download, 
  Printer, DocumentCopy, Grid, List, Histogram, PieChart
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'

const route = useRoute()
const router = useRouter()

// 当前报表ID
const reportId = ref(route.query.id)

// 报表配置
const reportConfig = ref({
  name: '新建报表',
  type: 'detail', // detail明细, summary汇总, chart图表, crosstab交叉
  pageSize: 'A4',
  orientation: 'portrait', // portrait竖向, landscape横向
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  header: {
    enabled: true,
    height: 80,
    content: '担保交易报表'
  },
  footer: {
    enabled: true,
    height: 60,
    content: '第 {page} 页 / 共 {total} 页'
  }
})

// 设计模式
const designMode = ref('table') // table表格, chart图表, parameter参数

// 报表元素
const reportElements = ref([
  {
    id: 1,
    type: 'title',
    label: '报表标题',
    content: 'B2B托管交易明细报表',
    style: {
      fontSize: 20,
      fontWeight: 'bold',
      align: 'center',
      height: 50
    }
  },
  {
    id: 2,
    type: 'parameter',
    label: '查询参数',
    fields: [
      { name: 'dateRange', label: '日期范围', type: 'daterange', required: true },
      { name: 'status', label: '订单状态', type: 'select', options: ['全部', '待确认', '已确认', '待结算', '已结算'] },
      { name: 'keyword', label: '关键词', type: 'input' }
    ]
  },
  {
    id: 3,
    type: 'table',
    label: '数据表格',
    columns: [
      { field: 'orderSn', header: '订单号', width: 150, align: 'left' },
      { field: 'buyerName', header: '买家', width: 100, align: 'left' },
      { field: 'sellerName', header: '卖家', width: 100, align: 'left' },
      { field: 'totalAmount', header: '金额', width: 100, align: 'right', format: 'currency' },
      { field: 'status', header: '状态', width: 100, align: 'center' },
      { field: 'createTime', header: '创建时间', width: 150, align: 'center', format: 'datetime' }
    ],
    groupBy: '', // 分组字段
    showSubtotal: false, // 显示小计
    showTotal: true // 显示合计
  },
  {
    id: 4,
    type: 'summary',
    label: '汇总统计',
    fields: [
      { label: '总笔数', value: '{count}', align: 'right' },
      { label: '总金额', value: '{sum_totalAmount}', align: 'right', format: 'currency' },
      { label: '平均金额', value: '{avg_totalAmount}', align: 'right', format: 'currency' }
    ]
  }
])

// 当前选中的元素
const selectedElement = ref(null)

// 工具箱组件
const toolboxComponents = [
  { type: 'title', label: '标题', icon: '📝' },
  { type: 'parameter', label: '参数', icon: '🔍' },
  { type: 'table', label: '表格', icon: '📋' },
  { type: 'chart', label: '图表', icon: '📊' },
  { type: 'summary', label: '汇总', icon: '∑' },
  { type: 'text', label: '文本', icon: '📄' },
  { type: 'image', label: '图片', icon: '🖼️' },
  { type: 'line', label: '分隔线', icon: '─' }
]

// 添加元素
const addElement = (type) => {
  const newElement = {
    id: Date.now(),
    type,
    label: getElementLabel(type),
    ...getDefaultElementProps(type)
  }
  reportElements.value.push(newElement)
  selectedElement.value = newElement
  ElMessage.success(`已添加${getElementLabel(type)}`)
}

// 删除元素
const deleteElement = (element) => {
  const index = reportElements.value.findIndex(e => e.id === element.id)
  reportElements.value.splice(index, 1)
  if (selectedElement.value?.id === element.id) {
    selectedElement.value = null
  }
  ElMessage.success('删除成功')
}

// 元素上移/下移
const moveElement = (element, direction) => {
  const index = reportElements.value.findIndex(e => e.id === element.id)
  if (direction === 'up' && index > 0) {
    [reportElements.value[index], reportElements.value[index - 1]] = 
    [reportElements.value[index - 1], reportElements.value[index]]
  } else if (direction === 'down' && index < reportElements.value.length - 1) {
    [reportElements.value[index], reportElements.value[index + 1]] = 
    [reportElements.value[index + 1], reportElements.value[index]]
  }
}

// 获取元素标签
const getElementLabel = (type) => {
  const labels = {
    title: '标题',
    parameter: '查询参数',
    table: '数据表格',
    chart: '图表',
    summary: '汇总统计',
    text: '文本',
    image: '图片',
    line: '分隔线'
  }
  return labels[type] || '未知元素'
}

// 获取默认属性
const getDefaultElementProps = (type) => {
  switch (type) {
    case 'title':
      return {
        content: '标题文本',
        style: { fontSize: 16, fontWeight: 'bold', align: 'center' }
      }
    case 'table':
      return {
        columns: [
          { field: 'field1', header: '列1', width: 100 },
          { field: 'field2', header: '列2', width: 100 }
        ]
      }
    case 'text':
      return { content: '文本内容' }
    case 'chart':
      return { chartType: 'bar', title: '图表标题' }
    default:
      return {}
  }
}

// 保存报表
const saveReport = () => {
  const report = {
    id: reportId.value || Date.now(),
    config: reportConfig.value,
    elements: reportElements.value,
    saveTime: new Date().toLocaleString('zh-CN')
  }
  
  // 模拟保存到本地存储
  localStorage.setItem(`report_${report.id}`, JSON.stringify(report))
  
  ElMessage.success('保存成功')
}

// 预览报表
const previewReport = () => {
  saveReport()
  router.push({
    path: '/report/preview',
    query: { id: reportId.value || 'new' }
  })
}

// 导出Excel
const exportExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('报表数据')
  
  // 添加标题
  worksheet.mergeCells('A1:F1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = reportConfig.value.name
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  
  // 添加表头
  const tableElement = reportElements.value.find(e => e.type === 'table')
  if (tableElement) {
    const headers = tableElement.columns.map(c => c.header)
    worksheet.addRow(headers)
    
    // 模拟数据
    const mockData = [
      ['20251125001', '买家A', '卖家X', 50000, '已确认', '2025-11-25 10:00'],
      ['20251125002', '买家B', '卖家Y', 30000, '待结算', '2025-11-25 11:00'],
      ['20251125003', '买家C', '卖家Z', 80000, '已结算', '2025-11-25 12:00']
    ]
    mockData.forEach(row => worksheet.addRow(row))
  }
  
  // 生成文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${reportConfig.value.name}_${Date.now()}.xlsx`
  link.click()
  
  ElMessage.success('导出成功')
}

// 导出PDF
const exportPDF = () => {
  const doc = new jsPDF()
  
  // 标题
  doc.setFontSize(18)
  doc.text(reportConfig.value.name, 105, 20, { align: 'center' })
  
  // 内容（简化版本）
  doc.setFontSize(12)
  doc.text('报表内容将在实际系统中生成...', 20, 40)
  
  // 保存
  doc.save(`${reportConfig.value.name}_${Date.now()}.pdf`)
  
  ElMessage.success('导出成功')
}

// 打印报表
const printReport = () => {
  window.print()
  ElMessage.info('请在打印对话框中选择打印机')
}
</script>

<template>
  <div class="report-designer">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
        <el-divider direction="vertical" />
        <el-input
          v-model="reportConfig.name"
          placeholder="报表名称"
          style="width: 200px"
        />
      </div>
      
      <div class="toolbar-center">
        <el-button-group>
          <el-button
            :type="designMode === 'table' ? 'primary' : ''"
            @click="designMode = 'table'"
          >
            表格设计
          </el-button>
          <el-button
            :type="designMode === 'chart' ? 'primary' : ''"
            @click="designMode = 'chart'"
          >
            图表设计
          </el-button>
          <el-button
            :type="designMode === 'parameter' ? 'primary' : ''"
            @click="designMode = 'parameter'"
          >
            参数设置
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-right">
        <el-button @click="saveReport">保存</el-button>
        <el-button type="success" :icon="View" @click="previewReport">预览</el-button>
        <el-dropdown trigger="click">
          <el-button type="primary">
            导出 <el-icon class="el-icon--right"><i class="el-icon-arrow-down" /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportExcel">
                <el-icon><Download /></el-icon> 导出Excel
              </el-dropdown-item>
              <el-dropdown-item @click="exportPDF">
                <el-icon><Download /></el-icon> 导出PDF
              </el-dropdown-item>
              <el-dropdown-item @click="printReport">
                <el-icon><Printer /></el-icon> 打印
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="designer-main">
      <!-- 左侧工具箱 -->
      <div class="toolbox">
        <h3>组件库</h3>
        <div class="component-list">
          <div
            v-for="comp in toolboxComponents"
            :key="comp.type"
            class="component-item"
            @click="addElement(comp.type)"
          >
            <span class="component-icon">{{ comp.icon }}</span>
            <span class="component-label">{{ comp.label }}</span>
          </div>
        </div>
      </div>

      <!-- 中间画布区 -->
      <div class="canvas-area">
        <div class="canvas-header">
          <span>报表画布</span>
          <el-tag size="small">{{ reportConfig.pageSize }} - {{ reportConfig.orientation === 'portrait' ? '竖向' : '横向' }}</el-tag>
        </div>
        
        <div class="canvas-body">
          <div class="page-canvas">
            <!-- 页眉 -->
            <div v-if="reportConfig.header.enabled" class="page-header">
              <div class="header-content">{{ reportConfig.header.content }}</div>
            </div>
            
            <!-- 报表元素 -->
            <div class="elements-container">
              <div
                v-for="(element, index) in reportElements"
                :key="element.id"
                class="element-wrapper"
                :class="{ active: selectedElement?.id === element.id }"
                @click="selectedElement = element"
              >
                <div class="element-toolbar">
                  <span class="element-label">{{ element.label }}</span>
                  <div class="element-actions">
                    <el-button-group size="small">
                      <el-button size="small" @click.stop="moveElement(element, 'up')">
                        ↑
                      </el-button>
                      <el-button size="small" @click.stop="moveElement(element, 'down')">
                        ↓
                      </el-button>
                      <el-button size="small" type="danger" @click.stop="deleteElement(element)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
                
                <!-- 元素内容预览 -->
                <div class="element-content">
                  <!-- 标题元素 -->
                  <div v-if="element.type === 'title'" class="element-title">
                    <h2 :style="{ textAlign: element.style?.align }">
                      {{ element.content }}
                    </h2>
                  </div>
                  
                  <!-- 参数元素 -->
                  <div v-else-if="element.type === 'parameter'" class="element-parameter">
                    <el-form :inline="true" label-width="80px">
                      <el-form-item
                        v-for="field in element.fields"
                        :key="field.name"
                        :label="field.label"
                      >
                        <el-input v-if="field.type === 'input'" placeholder="请输入" style="width: 150px" />
                        <el-select v-else-if="field.type === 'select'" placeholder="请选择" style="width: 150px">
                          <el-option
                            v-for="opt in field.options"
                            :key="opt"
                            :label="opt"
                            :value="opt"
                          />
                        </el-select>
                        <el-date-picker
                          v-else-if="field.type === 'daterange'"
                          type="daterange"
                          placeholder="选择日期"
                          style="width: 250px"
                        />
                      </el-form-item>
                    </el-form>
                  </div>
                  
                  <!-- 表格元素 -->
                  <div v-else-if="element.type === 'table'" class="element-table">
                    <table class="report-table">
                      <thead>
                        <tr>
                          <th
                            v-for="col in element.columns"
                            :key="col.field"
                            :style="{ width: col.width + 'px', textAlign: col.align }"
                          >
                            {{ col.header }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="i in 3" :key="i">
                          <td
                            v-for="col in element.columns"
                            :key="col.field"
                            :style="{ textAlign: col.align }"
                          >
                            示例数据{{ i }}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot v-if="element.showTotal">
                        <tr>
                          <td :colspan="element.columns.length - 1" style="text-align: right">
                            <strong>合计：</strong>
                          </td>
                          <td style="text-align: right">
                            <strong>{{ element.columns.length }}项</strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <!-- 汇总元素 -->
                  <div v-else-if="element.type === 'summary'" class="element-summary">
                    <div class="summary-row" v-for="field in element.fields" :key="field.label">
                      <span class="summary-label">{{ field.label }}：</span>
                      <span class="summary-value">{{ field.value }}</span>
                    </div>
                  </div>
                  
                  <!-- 其他元素 -->
                  <div v-else class="element-placeholder">
                    {{ element.label }} - 待实现
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 页脚 -->
            <div v-if="reportConfig.footer.enabled" class="page-footer">
              <div class="footer-content">{{ reportConfig.footer.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="properties-panel">
        <h3>属性设置</h3>
        
        <el-tabs v-if="selectedElement" model-value="basic">
          <el-tab-pane label="基本" name="basic">
            <el-form label-width="80px" size="small">
              <el-form-item label="标签">
                <el-input v-model="selectedElement.label" />
              </el-form-item>
              
              <!-- 标题特有属性 -->
              <template v-if="selectedElement.type === 'title'">
                <el-form-item label="内容">
                  <el-input v-model="selectedElement.content" />
                </el-form-item>
                <el-form-item label="字号">
                  <el-input-number v-model="selectedElement.style.fontSize" :min="12" :max="48" />
                </el-form-item>
                <el-form-item label="对齐">
                  <el-radio-group v-model="selectedElement.style.align">
                    <el-radio label="left">左对齐</el-radio>
                    <el-radio label="center">居中</el-radio>
                    <el-radio label="right">右对齐</el-radio>
                  </el-radio-group>
                </el-form-item>
              </template>
              
              <!-- 表格特有属性 -->
              <template v-if="selectedElement.type === 'table'">
                <el-form-item label="显示合计">
                  <el-switch v-model="selectedElement.showTotal" />
                </el-form-item>
                <el-form-item label="显示小计">
                  <el-switch v-model="selectedElement.showSubtotal" />
                </el-form-item>
              </template>
            </el-form>
          </el-tab-pane>
          
          <el-tab-pane label="数据" name="data">
            <el-alert
              title="数据源配置"
              type="info"
              description="在实际系统中，这里可以配置数据源SQL、接口等"
              :closable="false"
            />
          </el-tab-pane>
          
          <el-tab-pane label="样式" name="style">
            <el-alert
              title="样式配置"
              type="info"
              description="在实际系统中，这里可以配置字体、颜色、边框等样式"
              :closable="false"
            />
          </el-tab-pane>
        </el-tabs>
        
        <el-empty v-else description="请选择一个元素" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.designer-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.toolbox {
  width: 200px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 15px;
  overflow-y: auto;
}

.toolbox h3 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.component-item:hover {
  background: #e6f7ff;
  transform: translateX(2px);
}

.component-icon {
  font-size: 18px;
}

.component-label {
  font-size: 13px;
  color: #606266;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  font-size: 14px;
  font-weight: 500;
}

.canvas-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.page-canvas {
  width: 794px; /* A4宽度 */
  min-height: 1123px; /* A4高度 */
  margin: 0 auto;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.page-header,
.page-footer {
  padding: 10px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-bottom: 15px;
}

.page-footer {
  margin-top: 15px;
  margin-bottom: 0;
}

.elements-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.element-wrapper {
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
}

.element-wrapper:hover {
  border-color: #e6f7ff;
  background: #fafafa;
}

.element-wrapper.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.element-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #e8e8e8;
}

.element-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.element-content {
  padding: 15px;
}

.element-title h2 {
  margin: 0;
  color: #303133;
}

.element-parameter {
  background: #fafafa;
  padding: 15px;
  border-radius: 4px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table th,
.report-table td {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
}

.report-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
}

.report-table tfoot td {
  background: #fafafa;
  font-weight: 600;
}

.element-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary-label {
  color: #606266;
}

.summary-value {
  font-weight: 600;
  color: #303133;
}

.element-placeholder {
  padding: 40px;
  text-align: center;
  color: #909399;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
}

.properties-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e8e8e8;
  padding: 15px;
  overflow-y: auto;
}

.properties-panel h3 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0;
}

:deep(.el-form-item) {
  margin-bottom: 15px;
}

:deep(.el-alert) {
  margin: 15px 0;
}

@media print {
  .toolbar,
  .toolbox,
  .properties-panel {
    display: none !important;
  }
  
  .canvas-body {
    padding: 0;
  }
  
  .page-canvas {
    box-shadow: none;
    margin: 0;
  }
}
</style>
