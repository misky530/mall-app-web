<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAllB2BOrders } from '@/utils/reportData'
import * as echarts from 'echarts'

const router = useRouter()

// 主维度和次维度
const primaryDimension = ref('status') // 行
const secondaryDimension = ref('time') // 列

const dimensionOptions = [
  { value: 'status', label: '订单状态' },
  { value: 'time', label: '时间月份' },
  { value: 'seller', label: '卖家' },
  { value: 'amount', label: '金额段' }
]

// 交叉分析数据
const crossData = ref([])
const heatmapData = ref([])

// 行列标签
const rowLabels = ref([])
const colLabels = ref([])

// 加载数据
const loadData = () => {
  const orders = getAllB2BOrders()
  
  // 获取行列维度的所有值
  rowLabels.value = getLabelsForDimension(orders, primaryDimension.value)
  colLabels.value = getLabelsForDimension(orders, secondaryDimension.value)
  
  // 构建交叉表数据
  const matrix = []
  
  rowLabels.value.forEach((rowLabel, rowIdx) => {
    const row = { label: rowLabel, cells: [] }
    
    colLabels.value.forEach((colLabel, colIdx) => {
      // 筛选符合条件的订单
      const filteredOrders = orders.filter(o => 
        matchDimension(o, primaryDimension.value, rowLabel) &&
        matchDimension(o, secondaryDimension.value, colLabel)
      )
      
      const count = filteredOrders.length
      const amount = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      
      row.cells.push({ count, amount })
      
      // 热力图数据 [x, y, value]
      heatmapData.value.push([colIdx, rowIdx, amount])
    })
    
    matrix.push(row)
  })
  
  crossData.value = matrix
  
  renderHeatmap()
}

// 获取维度的所有标签
const getLabelsForDimension = (orders, dimension) => {
  const labelSet = new Set()
  
  orders.forEach(o => {
    const label = getDimensionValue(o, dimension)
    if (label) labelSet.add(label)
  })
  
  const labels = Array.from(labelSet)
  
  // 排序
  if (dimension === 'time') {
    return labels.sort()
  } else if (dimension === 'amount') {
    const order = ['0-1千', '1千-5千', '5千-1万', '1万-5万', '5万-10万', '10万-50万', '50万以上']
    return labels.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  } else if (dimension === 'status') {
    const order = ['待确认收款', '已确认待发货', '已发货待验收', '待结算', '已结算', '待仲裁', '仲裁完成']
    return labels.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }
  
  return labels.slice(0, 20) // 限制数量
}

// 获取维度值
const getDimensionValue = (order, dimension) => {
  switch (dimension) {
    case 'status':
      return getStatusText(order.status)
    case 'time':
      const date = new Date(order.createTime || order.submitVoucherTime)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    case 'seller':
      return order.sellerName || '未知卖家'
    case 'amount':
      return getAmountRange(order.totalAmount)
  }
}

// 判断订单是否匹配维度值
const matchDimension = (order, dimension, label) => {
  return getDimensionValue(order, dimension) === label
}

// 金额段
const getAmountRange = (amount) => {
  if (amount < 1000) return '0-1千'
  if (amount < 5000) return '1千-5千'
  if (amount < 10000) return '5千-1万'
  if (amount < 50000) return '1万-5万'
  if (amount < 100000) return '5万-10万'
  if (amount < 500000) return '10万-50万'
  return '50万以上'
}

// 状态文本
const getStatusText = (status) => {
  const map = {
    0: '待确认收款', 1: '已确认待发货', 2: '已发货待验收',
    3: '待结算', 4: '已结算', 5: '待仲裁', 6: '仲裁完成'
  }
  return map[status] || '未知'
}

// 渲染热力图
const renderHeatmap = () => {
  const chartDom = document.getElementById('heatmapChart')
  if (!chartDom) return
  
  const myChart = echarts.init(chartDom)
  
  const option = {
    title: {
      text: '交叉分析热力图',
      left: 'center'
    },
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const [colIdx, rowIdx, amount] = params.data
        const row = rowLabels.value[rowIdx]
        const col = colLabels.value[colIdx]
        const cell = crossData.value[rowIdx]?.cells[colIdx]
        return `${row} × ${col}<br/>
                订单数: ${cell?.count || 0}笔<br/>
                金额: ¥${formatAmount(amount)}`
      }
    },
    grid: {
      left: '15%',
      right: '5%',
      top: '15%',
      bottom: '10%'
    },
    xAxis: {
      type: 'category',
      data: colLabels.value,
      splitArea: { show: true },
      axisLabel: { rotate: 45, interval: 0 }
    },
    yAxis: {
      type: 'category',
      data: rowLabels.value,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.value.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e0f3ff', '#50a3ff', '#2070ff', '#0050ff', '#0030a0']
      }
    },
    series: [{
      name: '交易金额',
      type: 'heatmap',
      data: heatmapData.value,
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  myChart.setOption(option)
  window.addEventListener('resize', () => myChart.resize())
}

// 格式化金额
const formatAmount = (amount) => {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`
  }
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'
}

// 计算行/列合计
const getRowTotal = (row) => {
  return row.cells.reduce((sum, cell) => sum + cell.amount, 0)
}

const getColTotal = (colIdx) => {
  return crossData.value.reduce((sum, row) => sum + (row.cells[colIdx]?.amount || 0), 0)
}

const getGrandTotal = () => {
  return crossData.value.reduce((sum, row) => sum + getRowTotal(row), 0)
}

// 导出
const exportData = () => {
  let csv = `${primaryDimension.value},${colLabels.value.join(',')},合计\n`
  
  crossData.value.forEach(row => {
    const rowData = [
      row.label,
      ...row.cells.map(cell => cell.amount),
      getRowTotal(row)
    ]
    csv += rowData.join(',') + '\n'
  })
  
  // 列合计
  const colTotals = ['合计', ...colLabels.value.map((_, idx) => getColTotal(idx)), getGrandTotal()]
  csv += colTotals.join(',') + '\n'
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `交叉分析_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

// 监听维度变化
watch([primaryDimension, secondaryDimension], () => {
  heatmapData.value = []
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="cross-analysis-page">
    <div class="container">
      <!-- 头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
          <div class="title-group">
            <h1>多维交叉分析</h1>
            <p class="subtitle">Multi-dimensional Cross Analysis</p>
          </div>
        </div>
        <div class="header-right">
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button :icon="Download" type="primary" @click="exportData">导出</el-button>
        </div>
      </div>

      <!-- 维度选择 -->
      <el-card class="dimension-card" shadow="never">
        <template #header>
          <span>维度配置</span>
        </template>
        
        <div class="dimension-selector">
          <div class="selector-item">
            <label>行维度（主维度）：</label>
            <el-select v-model="primaryDimension" placeholder="选择行维度">
              <el-option
                v-for="opt in dimensionOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
                :disabled="opt.value === secondaryDimension"
              />
            </el-select>
          </div>
          
          <div class="swap-icon">×</div>
          
          <div class="selector-item">
            <label>列维度（次维度）：</label>
            <el-select v-model="secondaryDimension" placeholder="选择列维度">
              <el-option
                v-for="opt in dimensionOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
                :disabled="opt.value === primaryDimension"
              />
            </el-select>
          </div>
        </div>
      </el-card>

      <!-- 热力图 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span>可视化热力图</span>
        </template>
        <div id="heatmapChart" style="width: 100%; height: 600px;"></div>
      </el-card>

      <!-- 交叉表 -->
      <el-card class="table-card" shadow="never">
        <template #header>
          <span>交叉数据透视表</span>
        </template>
        
        <div class="cross-table-wrapper">
          <table class="cross-table">
            <thead>
              <tr>
                <th class="dimension-header">
                  {{ dimensionOptions.find(d => d.value === primaryDimension)?.label }}
                  \
                  {{ dimensionOptions.find(d => d.value === secondaryDimension)?.label }}
                </th>
                <th v-for="col in colLabels" :key="col" class="col-header">
                  {{ col }}
                </th>
                <th class="total-header">合计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIdx) in crossData" :key="rowIdx">
                <td class="row-header">{{ row.label }}</td>
                <td v-for="(cell, colIdx) in row.cells" :key="colIdx" class="data-cell">
                  <div class="cell-content">
                    <div class="cell-amount">¥{{ formatAmount(cell.amount) }}</div>
                    <div class="cell-count">{{ cell.count }}笔</div>
                  </div>
                </td>
                <td class="total-cell">
                  <div class="cell-content">
                    <div class="cell-amount">¥{{ formatAmount(getRowTotal(row)) }}</div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="total-header">合计</td>
                <td v-for="(col, colIdx) in colLabels" :key="colIdx" class="total-cell">
                  <div class="cell-content">
                    <div class="cell-amount">¥{{ formatAmount(getColTotal(colIdx)) }}</div>
                  </div>
                </td>
                <td class="grand-total-cell">
                  <div class="cell-content">
                    <div class="cell-amount">¥{{ formatAmount(getGrandTotal()) }}</div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.cross-analysis-page {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 0;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-group h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 10px;
}

.dimension-card,
.chart-card,
.table-card {
  margin-bottom: 20px;
}

.dimension-selector {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 10px 0;
}

.selector-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selector-item label {
  font-weight: 500;
  white-space: nowrap;
}

.swap-icon {
  font-size: 24px;
  color: #909399;
  font-weight: bold;
}

.cross-table-wrapper {
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
}

.cross-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.cross-table th,
.cross-table td {
  border: 1px solid #e8e8e8;
  padding: 12px 8px;
  text-align: center;
  min-width: 100px;
}

.dimension-header {
  background: #fafafa;
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 3;
}

.col-header,
.total-header {
  background: #f5f7fa;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}

.row-header {
  background: #fafafa;
  font-weight: 500;
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
  padding-left: 15px;
}

.data-cell {
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.data-cell:hover {
  background: #f0f9ff;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-amount {
  font-weight: 600;
  color: #303133;
}

.cell-count {
  font-size: 12px;
  color: #909399;
}

.total-cell {
  background: #f9f9f9;
  font-weight: 600;
}

.grand-total-cell {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  font-size: 15px;
}

tfoot tr {
  position: sticky;
  bottom: 0;
  z-index: 2;
}

:deep(.el-card__header) {
  background: #fafafa;
  font-weight: 600;
}

@media (max-width: 768px) {
  .dimension-selector {
    flex-direction: column;
    gap: 15px;
  }
  
  .swap-icon {
    transform: rotate(90deg);
  }
  
  .cross-table {
    font-size: 11px;
  }
  
  .cross-table th,
  .cross-table td {
    min-width: 80px;
    padding: 8px 4px;
  }
}
</style>
