<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { InfoFilled } from '@element-plus/icons-vue'
import { getAllB2BOrders } from '@/utils/reportData'

// 图表实例
const verifyChartRef = ref(null)
const disputeChartRef = ref(null)
const settlementChartRef = ref(null)

let verifyChart = null
let disputeChart = null
let settlementChart = null

// 效率数据
const efficiencyData = ref({
  verify: { rate: 0, onTime: 0, total: 0 },
  dispute: { rate: 0, onTime: 0, total: 0 },
  settlement: { rate: 0, onTime: 0, total: 0 }
})

// 计算效率指标
const calculateEfficiency = () => {
  const orders = getAllB2BOrders()
  const now = new Date()

  // 1. 收款确认及时率（应在24小时内确认）
  const verifyOrders = orders.filter(order => order.verifyTime)
  let verifyOnTime = 0

  verifyOrders.forEach(order => {
    const createTime = new Date(order.createTime || order.submitVoucherTime)
    const verifyTime = new Date(order.verifyTime)
    const hours = (verifyTime - createTime) / (1000 * 60 * 60)

    if (hours <= 24) verifyOnTime++
  })

  efficiencyData.value.verify = {
    rate: verifyOrders.length > 0 ? Math.round((verifyOnTime / verifyOrders.length) * 100) : 0,
    onTime: verifyOnTime,
    total: verifyOrders.length
  }

  // 2. 争议响应及时率（验收失败应在48小时内仲裁）
  const disputeOrders = orders.filter(order => order.status === -2 || order.status === -3)
  let disputeOnTime = 0

  disputeOrders.forEach(order => {
    if (order.acceptanceTime && order.arbitrationTime) {
      const acceptTime = new Date(order.acceptanceTime)
      const arbitrationTime = new Date(order.arbitrationTime)
      const hours = (arbitrationTime - acceptTime) / (1000 * 60 * 60)

      if (hours <= 48) disputeOnTime++
    } else if (!order.arbitrationTime && order.acceptanceTime) {
      // 尚未仲裁，检查是否已超时
      const acceptTime = new Date(order.acceptanceTime)
      const hours = (now - acceptTime) / (1000 * 60 * 60)
      // 如果还在48小时内，暂不计入超时
    }
  })

  efficiencyData.value.dispute = {
    rate: disputeOrders.length > 0 ? Math.round((disputeOnTime / disputeOrders.length) * 100) : 100,
    onTime: disputeOnTime,
    total: disputeOrders.length
  }

  // 3. 结算执行及时率（应在7天内结算）
  const settlementOrders = orders.filter(order => order.status === 4)
  let settlementOnTime = 0

  settlementOrders.forEach(order => {
    if (order.acceptanceTime && order.settlementTime) {
      const acceptTime = new Date(order.acceptanceTime || order.verifyTime)
      const settlementTime = new Date(order.settlementTime)
      const days = (settlementTime - acceptTime) / (1000 * 60 * 60 * 24)

      if (days <= 7) settlementOnTime++
    }
  })

  efficiencyData.value.settlement = {
    rate: settlementOrders.length > 0 ? Math.round((settlementOnTime / settlementOrders.length) * 100) : 0,
    onTime: settlementOnTime,
    total: settlementOrders.length
  }
}

// 创建仪表盘图表
const createGauge = (chartRef, rate, title) => {
  if (!chartRef.value) return null

  const chart = echarts.init(chartRef.value)

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        radius: '80%',
        center: ['50%', '60%'],
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.6, '#ff4d4f'],
              [0.8, '#faad14'],
              [1, '#52c41a']
            ]
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          },
          width: 6,
          length: '60%'
        },
        axisTick: {
          distance: -16,
          length: 6,
          lineStyle: {
            color: '#fff',
            width: 1
          }
        },
        splitLine: {
          distance: -20,
          length: 12,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        axisLabel: {
          color: '#8c8c8c',
          distance: 25,
          fontSize: 11,
          formatter: (value) => {
            if (value === 0 || value === 50 || value === 100) {
              return value
            }
            return ''
          }
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: 'auto',
          fontSize: 28,
          fontWeight: 700,
          offsetCenter: [0, '80%']
        },
        data: [
          {
            value: rate,
            name: title,
            title: {
              offsetCenter: [0, '-20%'],
              fontSize: 14,
              color: '#595959'
            }
          }
        ]
      }
    ]
  }

  chart.setOption(option)
  return chart
}

// 初始化所有图表
const initCharts = () => {
  verifyChart = createGauge(verifyChartRef, efficiencyData.value.verify.rate, '收款确认及时率')
  disputeChart = createGauge(disputeChartRef, efficiencyData.value.dispute.rate, '争议响应及时率')
  settlementChart = createGauge(settlementChartRef, efficiencyData.value.settlement.rate, '结算执行及时率')

  // 响应式
  window.addEventListener('resize', () => {
    verifyChart?.resize()
    disputeChart?.resize()
    settlementChart?.resize()
  })
}

// 加载数据
const loadData = () => {
  calculateEfficiency()
  initCharts()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="efficiency-gauge">
    <div class="section-header">
      <h3>操作及时率</h3>
      <p class="subtitle">Operational Efficiency Dashboard</p>
    </div>

    <div class="gauge-grid">
      <!-- 收款确认及时率 -->
      <div class="gauge-card">
        <div ref="verifyChartRef" class="gauge-chart"></div>
        <div class="gauge-info">
          <div class="info-item">
            <span class="label">及时确认</span>
            <span class="value">{{ efficiencyData.verify.onTime }}笔</span>
          </div>
          <div class="info-item">
            <span class="label">总计</span>
            <span class="value">{{ efficiencyData.verify.total }}笔</span>
          </div>
        </div>
        <div class="standard">
          <el-icon :size="14"><InfoFilled /></el-icon>
          <span>标准：24小时内确认</span>
        </div>
      </div>

      <!-- 争议响应及时率 -->
      <div class="gauge-card">
        <div ref="disputeChartRef" class="gauge-chart"></div>
        <div class="gauge-info">
          <div class="info-item">
            <span class="label">及时响应</span>
            <span class="value">{{ efficiencyData.dispute.onTime }}笔</span>
          </div>
          <div class="info-item">
            <span class="label">总计</span>
            <span class="value">{{ efficiencyData.dispute.total }}笔</span>
          </div>
        </div>
        <div class="standard">
          <el-icon :size="14"><InfoFilled /></el-icon>
          <span>标准：48小时内仲裁</span>
        </div>
      </div>

      <!-- 结算执行及时率 -->
      <div class="gauge-card">
        <div ref="settlementChartRef" class="gauge-chart"></div>
        <div class="gauge-info">
          <div class="info-item">
            <span class="label">及时结算</span>
            <span class="value">{{ efficiencyData.settlement.onTime }}笔</span>
          </div>
          <div class="info-item">
            <span class="label">总计</span>
            <span class="value">{{ efficiencyData.settlement.total }}笔</span>
          </div>
        </div>
        <div class="standard">
          <el-icon :size="14"><InfoFilled /></el-icon>
          <span>标准：7天内结算</span>
        </div>
      </div>
    </div>

    <!-- 评级说明 -->
    <div class="rating-guide">
      <div class="guide-title">评级标准</div>
      <div class="guide-items">
        <div class="guide-item excellent">
          <div class="color-bar"></div>
          <span>优秀 ≥80%</span>
        </div>
        <div class="guide-item good">
          <div class="color-bar"></div>
          <span>良好 60-80%</span>
        </div>
        <div class="guide-item poor">
          <div class="color-bar"></div>
          <span>待改进 <60%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.efficiency-gauge {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-size: 12px;
      color: $text-placeholder;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .gauge-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 24px;

    .gauge-card {
      background: #fafafa;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;

      .gauge-chart {
        width: 100%;
        height: 200px;
      }

      .gauge-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 12px;

        .info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: white;
          border-radius: 4px;

          .label {
            font-size: 12px;
            color: $text-secondary;
            margin-bottom: 4px;
          }

          .value {
            font-size: 16px;
            font-weight: 600;
            color: $text-primary;
          }
        }
      }

      .standard {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 12px;
        padding: 8px;
        background: #e6f7ff;
        border-radius: 4px;
        font-size: 12px;
        color: #0050b3;
      }
    }
  }

  .rating-guide {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 16px;

    .guide-title {
      font-size: 13px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12px;
    }

    .guide-items {
      display: flex;
      gap: 24px;

      .guide-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: $text-secondary;

        .color-bar {
          width: 32px;
          height: 12px;
          border-radius: 6px;
        }

        &.excellent .color-bar {
          background: #52c41a;
        }

        &.good .color-bar {
          background: #faad14;
        }

        &.poor .color-bar {
          background: #ff4d4f;
        }
      }
    }
  }
}
</style>
