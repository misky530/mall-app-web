<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, Printer, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAllB2BOrders } from '@/utils/reportData'

const route = useRoute()
const router = useRouter()

// 报表数据
const reportData = ref([])
const reportConfig = ref({
  name: 'B2B托管交易明细报表',
  pageSize: 'A4',
  header: {
    enabled: true,
    content: '担保交易报表'
  },
  footer: {
    enabled: true,
    content: '第 {page} 页 / 共 {total} 页'
  }
})

// 查询参数
const queryParams = ref({
  dateRange: [],
  status: '',
  keyword: ''
})

// 统计数据
const statistics = ref({
  totalCount: 0,
  totalAmount: 0,
  avgAmount: 0
})

// 加载数据
const loadData = () => {
  let orders = getAllB2BOrders()
  
  // 应用筛选
  if (queryParams.value.status) {
    orders = orders.filter(o => o.status === parseInt(queryParams.value.status))
  }
  
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase()
    orders = orders.filter(o => 
      o.orderSn?.toLowerCase().includes(keyword) ||
      o.sellerName?.toLowerCase().includes(keyword) ||
      o.buyerName?.toLowerCase().includes(keyword)
    )
  }
  
  reportData.value = orders
  
  // 计算统计
  statistics.value = {
    totalCount: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    avgAmount: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0
  }
}

// 导出Excel
const exportExcel = () => {
  ElMessage.success('导出Excel功能已触发')
}

// 导出PDF
const exportPDF = () => {
  ElMessage.success('导出PDF功能已触发')
}

// 打印
const handlePrint = () => {
  window.print()
}

// 刷新数据
const refreshData = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

// 状态文本
const getStatusText = (status) => {
  const map = {
    0: '待确认收款', 1: '已确认待发货', 2: '已发货待验收',
    3: '待结算', 4: '已结算', 5: '待仲裁', 6: '仲裁完成'
  }
  return map[status] || '未知'
}

// 格式化金额
const formatAmount = (amount) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="report-preview">
    <!-- 工具栏 -->
    <div class="preview-toolbar no-print">
      <div class="toolbar-left">
        <el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
        <el-divider direction="vertical" />
        <span class="report-title">{{ reportConfig.name }}</span>
      </div>
      
      <div class="toolbar-right">
        <el-button :icon="RefreshRight" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="exportExcel">导出Excel</el-button>
        <el-button :icon="Download" @click="exportPDF">导出PDF</el-button>
        <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
      </div>
    </div>

    <!-- 参数区域 -->
    <div class="parameter-section no-print">
      <el-card shadow="never">
        <template #header>
          <span>查询条件</span>
        </template>
        
        <el-form :inline="true" :model="queryParams">
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="queryParams.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
          
          <el-form-item label="订单状态">
            <el-select v-model="queryParams.status" placeholder="全部" clearable>
              <el-option label="待确认收款" value="0" />
              <el-option label="已确认待发货" value="1" />
              <el-option label="已发货待验收" value="2" />
              <el-option label="待结算" value="3" />
              <el-option label="已结算" value="4" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="关键词">
            <el-input v-model="queryParams.keyword" placeholder="订单号/买家/卖家" clearable />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="loadData">查询</el-button>
            <el-button @click="queryParams = { dateRange: [], status: '', keyword: '' }; loadData()">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 报表内容区域 -->
    <div class="report-content">
      <div class="report-page">
        <!-- 报表头部 -->
        <div v-if="reportConfig.header.enabled" class="report-header">
          <div class="header-content">
            <h1>{{ reportConfig.name }}</h1>
            <p class="report-date">生成时间：{{ new Date().toLocaleString('zh-CN') }}</p>
          </div>
        </div>

        <!-- 报表主体 -->
        <div class="report-body">
          <!-- 数据表格 -->
          <table class="report-table">
            <thead>
              <tr>
                <th width="150">订单号</th>
                <th width="120">买家</th>
                <th width="120">卖家</th>
                <th width="120" style="text-align: right">金额（元）</th>
                <th width="100" style="text-align: center">状态</th>
                <th width="180" style="text-align: center">创建时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in reportData" :key="order.id">
                <td>{{ order.orderSn }}</td>
                <td>{{ order.buyerName || `买家${order.memberId}` }}</td>
                <td>{{ order.sellerName || '未知卖家' }}</td>
                <td style="text-align: right">{{ formatAmount(order.totalAmount) }}</td>
                <td style="text-align: center">{{ getStatusText(order.status) }}</td>
                <td style="text-align: center">{{ formatDate(order.createTime || order.submitVoucherTime) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="text-align: right"><strong>合计：</strong></td>
                <td style="text-align: right"><strong>{{ formatAmount(statistics.totalAmount) }}</strong></td>
                <td colspan="2" style="text-align: center"><strong>共 {{ statistics.totalCount }} 笔</strong></td>
              </tr>
            </tfoot>
          </table>

          <!-- 汇总统计 -->
          <div class="summary-section">
            <h3>汇总统计</h3>
            <table class="summary-table">
              <tr>
                <td class="summary-label">总笔数：</td>
                <td class="summary-value">{{ statistics.totalCount }} 笔</td>
                <td class="summary-label">总金额：</td>
                <td class="summary-value">¥{{ formatAmount(statistics.totalAmount) }}</td>
              </tr>
              <tr>
                <td class="summary-label">平均金额：</td>
                <td class="summary-value">¥{{ formatAmount(statistics.avgAmount) }}</td>
                <td class="summary-label">最大单笔：</td>
                <td class="summary-value">
                  ¥{{ formatAmount(Math.max(...reportData.map(o => o.totalAmount || 0))) }}
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- 报表页脚 -->
        <div v-if="reportConfig.footer.enabled" class="report-footer">
          <p>{{ reportConfig.footer.content.replace('{page}', '1').replace('{total}', '1') }}</p>
          <p class="print-info">打印人：__________ 打印时间：__________</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-preview {
  background: #f5f7fa;
  min-height: 100vh;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.parameter-section {
  padding: 20px;
}

.report-content {
  padding: 20px;
}

.report-page {
  width: 794px; /* A4 宽度 */
  min-height: 1123px; /* A4 高度 */
  margin: 0 auto;
  background: white;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.report-header {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #303133;
  margin-bottom: 30px;
}

.report-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.report-date {
  margin: 10px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.report-body {
  margin-bottom: 30px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  font-size: 13px;
}

.report-table th,
.report-table td {
  border: 1px solid #d9d9d9;
  padding: 10px 8px;
}

.report-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.report-table tbody tr:hover {
  background: #fafafa;
}

.report-table tfoot {
  background: #f5f7fa;
  font-weight: 600;
}

.total-row td {
  border-top: 2px solid #303133;
}

.summary-section {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.summary-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table td {
  padding: 8px 12px;
  font-size: 14px;
}

.summary-label {
  width: 25%;
  color: #606266;
  text-align: right;
}

.summary-value {
  width: 25%;
  font-weight: 600;
  color: #303133;
}

.report-footer {
  padding-top: 20px;
  border-top: 1px solid #d9d9d9;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

.print-info {
  margin: 10px 0 0 0;
  text-align: right;
}

/* 打印样式 */
@media print {
  .no-print {
    display: none !important;
  }
  
  .report-preview {
    background: white;
  }
  
  .report-content {
    padding: 0;
  }
  
  .report-page {
    width: 100%;
    box-shadow: none;
    padding: 20px;
    margin: 0;
  }
  
  .report-table {
    page-break-inside: avoid;
  }
  
  @page {
    size: A4;
    margin: 1cm;
  }
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background: #fafafa;
  font-weight: 600;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
