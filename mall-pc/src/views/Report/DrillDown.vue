<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, Filter } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAllB2BOrders } from '@/utils/reportData'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

// 当前钻取的维度
const dimension = ref(route.query.dimension || 'status') // status | time | seller | buyer | amount
const drillLevel = ref(parseInt(route.query.level) || 1) // 1: 概览, 2: 明细, 3: 详细

// 面包屑导航
const breadcrumbs = computed(() => {
  const crumbs = [
    { label: 'Dashboard', path: '/report' },
    { label: '数据分析', path: null }
  ]
  
  if (drillLevel.value >= 2) {
    crumbs.push({ label: getDimensionLabel(), path: null })
  }
  
  return crumbs
})

const getDimensionLabel = () => {
  const labels = {
    status: '按状态分析',
    time: '按时间分析',
    seller: '按卖家分析',
    buyer: '按买家分析',
    amount: '按金额段分析'
  }
  return labels[dimension.value] || '数据分析'
}

// 筛选条件
const filters = ref({
  dateRange: [],
  status: '',
  minAmount: null,
  maxAmount: null,
  keyword: ''
})

// 统计数据
const statistics = ref({
  totalOrders: 0,
  totalAmount: 0,
  avgAmount: 0,
  maxAmount: 0,
  minAmount: 0
})

// 图表数据
const chartData = ref([])
const detailData = ref([])

// 加载数据
const loadData = async () => {
  try {
    let orders = await getAllB2BOrders()
  
  // 应用筛选
  if (filters.value.dateRange?.length === 2) {
    const [start, end] = filters.value.dateRange
    orders = orders.filter(o => {
      const date = new Date(o.createTime || o.submitVoucherTime)
      return date >= start && date <= end
    })
  }
  
  if (filters.value.status) {
    orders = orders.filter(o => o.status === parseInt(filters.value.status))
  }
  
  if (filters.value.minAmount) {
    orders = orders.filter(o => o.totalAmount >= filters.value.minAmount)
  }
  
  if (filters.value.maxAmount) {
    orders = orders.filter(o => o.totalAmount <= filters.value.maxAmount)
  }
  
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    orders = orders.filter(o => 
      o.orderSn?.toLowerCase().includes(keyword) ||
      o.sellerName?.toLowerCase().includes(keyword) ||
      o.buyerName?.toLowerCase().includes(keyword)
    )
  }
  
  // 计算统计数据
  statistics.value = {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    avgAmount: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0,
    maxAmount: Math.max(...orders.map(o => o.totalAmount || 0)),
    minAmount: Math.min(...orders.map(o => o.totalAmount || 0))
  }
  
  // 根据维度聚合数据
  aggregateByDimension(orders)
  
  // 设置明细数据
  detailData.value = orders.map(o => ({
    ...o,
    statusText: getStatusText(o.status)
  }))
  } catch (error) {
    console.error('加载钻取数据失败:', error)
    detailData.value = []
    chartData.value = []
  }
}

// 按维度聚合
const aggregateByDimension = (orders) => {
  switch (dimension.value) {
    case 'status':
      aggregateByStatus(orders)
      break
    case 'time':
      aggregateByTime(orders)
      break
    case 'seller':
      aggregateBySeller(orders)
      break
    case 'buyer':
      aggregateByBuyer(orders)
      break
    case 'amount':
      aggregateByAmount(orders)
      break
  }
}

// 按状态聚合
const aggregateByStatus = (orders) => {
  const statusMap = new Map()
  const statusNames = {
    0: '待确认收款',
    1: '已确认待发货',
    2: '已发货待验收',
    3: '待结算',
    4: '已结算',
    5: '待仲裁',
    6: '仲裁完成'
  }
  
  orders.forEach(o => {
    const status = o.status
    if (!statusMap.has(status)) {
      statusMap.set(status, { count: 0, amount: 0 })
    }
    const stat = statusMap.get(status)
    stat.count++
    stat.amount += o.totalAmount || 0
  })
  
  chartData.value = Array.from(statusMap.entries()).map(([status, data]) => ({
    name: statusNames[status] || `状态${status}`,
    value: data.amount,
    count: data.count,
    status
  })).sort((a, b) => b.value - a.value)
}

// 按时间聚合（按月）
const aggregateByTime = (orders) => {
  const timeMap = new Map()
  
  orders.forEach(o => {
    const date = new Date(o.createTime || o.submitVoucherTime)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!timeMap.has(month)) {
      timeMap.set(month, { count: 0, amount: 0 })
    }
    const stat = timeMap.get(month)
    stat.count++
    stat.amount += o.totalAmount || 0
  })
  
  chartData.value = Array.from(timeMap.entries())
    .map(([month, data]) => ({
      name: month,
      value: data.amount,
      count: data.count
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// 按卖家聚合
const aggregateBySeller = (orders) => {
  const sellerMap = new Map()
  
  orders.forEach(o => {
    const seller = o.sellerName || '未知卖家'
    if (!sellerMap.has(seller)) {
      sellerMap.set(seller, { count: 0, amount: 0, sellerId: o.sellerId })
    }
    const stat = sellerMap.get(seller)
    stat.count++
    stat.amount += o.totalAmount || 0
  })
  
  chartData.value = Array.from(sellerMap.entries())
    .map(([name, data]) => ({
      name,
      value: data.amount,
      count: data.count,
      sellerId: data.sellerId
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20) // Top 20
}

// 按买家聚合
const aggregateByBuyer = (orders) => {
  const buyerMap = new Map()
  
  orders.forEach(o => {
    const buyer = o.buyerName || `买家${o.memberId}`
    if (!buyerMap.has(buyer)) {
      buyerMap.set(buyer, { count: 0, amount: 0, buyerId: o.memberId })
    }
    const stat = buyerMap.get(buyer)
    stat.count++
    stat.amount += o.totalAmount || 0
  })
  
  chartData.value = Array.from(buyerMap.entries())
    .map(([name, data]) => ({
      name,
      value: data.amount,
      count: data.count,
      buyerId: data.buyerId
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20)
}

// 按金额段聚合
const aggregateByAmount = (orders) => {
  const ranges = [
    { min: 0, max: 1000, label: '0-1千' },
    { min: 1000, max: 5000, label: '1千-5千' },
    { min: 5000, max: 10000, label: '5千-1万' },
    { min: 10000, max: 50000, label: '1万-5万' },
    { min: 50000, max: 100000, label: '5万-10万' },
    { min: 100000, max: 500000, label: '10万-50万' },
    { min: 500000, max: Infinity, label: '50万以上' }
  ]
  
  const rangeMap = new Map()
  ranges.forEach(r => rangeMap.set(r.label, { count: 0, amount: 0, range: r }))
  
  orders.forEach(o => {
    const amount = o.totalAmount || 0
    const range = ranges.find(r => amount >= r.min && amount < r.max)
    if (range) {
      const stat = rangeMap.get(range.label)
      stat.count++
      stat.amount += amount
    }
  })
  
  chartData.value = ranges.map(r => ({
    name: r.label,
    value: rangeMap.get(r.label).amount,
    count: rangeMap.get(r.label).count
  }))
}

// 渲染图表
const renderChart = () => {
  const chartDom = document.getElementById('drillChart')
  if (!chartDom) return
  
  const myChart = echarts.init(chartDom)
  
  let option = {}
  
  if (dimension.value === 'time') {
    // 时间趋势用折线图
    option = {
      title: { text: '交易趋势', left: 'center' },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const data = params[0]
          const item = chartData.value[data.dataIndex]
          return `${data.name}<br/>
                  交易金额: ¥${formatAmount(item.value)}<br/>
                  订单数: ${item.count}笔`
        }
      },
      xAxis: {
        type: 'category',
        data: chartData.value.map(d => d.name),
        axisLabel: { rotate: 45 }
      },
      yAxis: [
        { type: 'value', name: '金额（元）' },
        { type: 'value', name: '订单数' }
      ],
      series: [
        {
          name: '交易金额',
          type: 'line',
          data: chartData.value.map(d => d.value),
          smooth: true,
          areaStyle: { opacity: 0.3 }
        },
        {
          name: '订单数',
          type: 'bar',
          yAxisIndex: 1,
          data: chartData.value.map(d => d.count)
        }
      ]
    }
  } else {
    // 其他维度用柱状图
    option = {
      title: { text: getDimensionLabel(), left: 'center' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const data = params[0]
          const item = chartData.value[data.dataIndex]
          return `${data.name}<br/>
                  交易金额: ¥${formatAmount(item.value)}<br/>
                  订单数: ${item.count}笔<br/>
                  平均金额: ¥${formatAmount(item.value / item.count)}`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chartData.value.map(d => d.name),
        axisLabel: { rotate: 45, interval: 0 }
      },
      yAxis: { type: 'value', name: '金额（元）' },
      series: [{
        name: '交易金额',
        type: 'bar',
        data: chartData.value.map(d => ({
          value: d.value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        })),
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }]
    }
  }
  
  myChart.setOption(option)
  
  // 点击柱状图钻取到明细
  myChart.on('click', (params) => {
    handleDrillToDetail(params.name)
  })
  
  // 响应式
  window.addEventListener('resize', () => myChart.resize())
}

// 钻取到明细
const handleDrillToDetail = (filterValue) => {
  drillLevel.value = 3
  ElMessage.success(`查看 ${filterValue} 的明细数据`)
  
  // 根据点击的项筛选数据
  if (dimension.value === 'status') {
    const item = chartData.value.find(d => d.name === filterValue)
    if (item) {
      filters.value.status = item.status.toString()
      loadData()
    }
  }
}

// 切换维度
const changeDimension = (newDimension) => {
  dimension.value = newDimension
  drillLevel.value = 2
  router.push({ query: { dimension: newDimension, level: 2 } })
  loadData()
  setTimeout(renderChart, 100)
}

// 导出数据
const exportData = () => {
  const csvContent = detailData.value.map(row => 
    [
      row.orderSn,
      row.statusText,
      row.totalAmount,
      row.sellerName || '',
      row.buyerName || '',
      new Date(row.createTime || row.submitVoucherTime).toLocaleString('zh-CN')
    ].join(',')
  ).join('\n')
  
  const header = '订单号,状态,金额,卖家,买家,创建时间\n'
  const blob = new Blob(['\ufeff' + header + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `报表数据_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

// 格式化金额
const formatAmount = (amount) => {
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    0: '待确认收款', 1: '已确认待发货', 2: '已发货待验收',
    3: '待结算', 4: '已结算', 5: '待仲裁', 6: '仲裁完成'
  }
  return map[status] || '未知'
}

onMounted(() => {
  loadData()
  setTimeout(renderChart, 100)
})
</script>

<template>
  <div class="drill-down-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          :to="crumb.path"
        >
          {{ crumb.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 操作栏 -->
      <div class="toolbar">
        <el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
        
        <div class="dimension-tabs">
          <el-button
            v-for="dim in ['status', 'time', 'seller', 'buyer', 'amount']"
            :key="dim"
            :type="dimension === dim ? 'primary' : ''"
            @click="changeDimension(dim)"
          >
            {{ { status: '按状态', time: '按时间', seller: '按卖家', buyer: '按买家', amount: '按金额' }[dim] }}
          </el-button>
        </div>
        
        <el-button :icon="Download" @click="exportData">导出数据</el-button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">订单总数</div>
          <div class="stat-value">{{ statistics.totalOrders }}<span class="unit">笔</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">交易总额</div>
          <div class="stat-value">¥{{ formatAmount(statistics.totalAmount) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均金额</div>
          <div class="stat-value">¥{{ formatAmount(statistics.avgAmount) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最大单笔</div>
          <div class="stat-value">¥{{ formatAmount(statistics.maxAmount) }}</div>
        </div>
      </div>

      <!-- 筛选器 -->
      <el-card class="filter-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span><el-icon><Filter /></el-icon> 数据筛选</span>
          </div>
        </template>
        
        <el-form :inline="true" :model="filters">
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadData(); renderChart()"
            />
          </el-form-item>
          
          <el-form-item label="订单状态">
            <el-select v-model="filters.status" placeholder="全部" clearable @change="loadData(); renderChart()">
              <el-option label="待确认收款" value="0" />
              <el-option label="已确认待发货" value="1" />
              <el-option label="已发货待验收" value="2" />
              <el-option label="待结算" value="3" />
              <el-option label="已结算" value="4" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="金额范围">
            <el-input-number v-model="filters.minAmount" placeholder="最小" :controls="false" style="width: 120px" />
            <span style="margin: 0 8px">-</span>
            <el-input-number v-model="filters.maxAmount" placeholder="最大" :controls="false" style="width: 120px" />
          </el-form-item>
          
          <el-form-item label="关键词">
            <el-input v-model="filters.keyword" placeholder="订单号/卖家/买家" clearable style="width: 200px" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="loadData(); renderChart()">查询</el-button>
            <el-button @click="filters = { dateRange: [], status: '', minAmount: null, maxAmount: null, keyword: '' }; loadData(); renderChart()">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 图表 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>{{ getDimensionLabel() }} - 可视化分析（点击钻取明细）</span>
          </div>
        </template>
        <div id="drillChart" style="width: 100%; height: 500px;"></div>
      </el-card>

      <!-- 数据表格 -->
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>明细数据列表</span>
            <span class="count">共 {{ detailData.length }} 条</span>
          </div>
        </template>
        
        <el-table :data="detailData" stripe border max-height="600">
          <el-table-column prop="orderSn" label="订单号" width="180" fixed />
          <el-table-column prop="statusText" label="状态" width="120" />
          <el-table-column prop="totalAmount" label="金额" width="120">
            <template #default="{ row }">
              ¥{{ formatAmount(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="sellerName" label="卖家" width="150" />
          <el-table-column prop="buyerName" label="买家" width="150" />
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.createTime || row.submitVoucherTime).toLocaleString('zh-CN') }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="router.push(`/order/detail/${row.id}`)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.drill-down-page {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.breadcrumb {
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
}

.dimension-tabs {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.unit {
  font-size: 16px;
  margin-left: 5px;
}

.filter-card,
.chart-card,
.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.count {
  color: #909399;
  font-size: 14px;
}

:deep(.el-card__header) {
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 10px;
  }
  
  .dimension-tabs {
    flex-wrap: wrap;
  }
}
</style>
