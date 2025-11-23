<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import TrendChart from './components/TrendChart.vue'
import {
  getCapitalByStatus,
  getTodayStats,
  getOvertimeOrders,
  getAverageCycleDays,
  generateMockOrdersIfNeeded,
  getAllB2BOrders
} from '@/utils/reportData'

const router = useRouter()

// 关键指标数据
const kpiData = ref({
  totalCapital: 0,        // 监管总资金
  todayInflow: 0,         // 今日流入
  todayOutflow: 0,        // 今日流出
  avgCycle: 0,            // 平均周期
  pendingCount: 0,        // 待处理笔数
  riskCount: 0            // 风险预警数
})

// 资金池分布数据
const capitalDistribution = ref([])

// 业务处理效率
const efficiency = ref({
  verifyRate: 0,
  disputeRate: 0,
  settlementRate: 0
})

// 加载数据
const loadData = () => {
  generateMockOrdersIfNeeded()

  const capitalData = getCapitalByStatus()
  const todayStats = getTodayStats()
  const overtime = getOvertimeOrders()
  const orders = getAllB2BOrders()

  // KPI指标
  kpiData.value = {
    totalCapital: capitalData.total,
    todayInflow: todayStats.todayVerified.amount,
    todayOutflow: todayStats.todaySettled.amount,
    avgCycle: getAverageCycleDays(),
    pendingCount: capitalData.pendingVerify.count + capitalData.pendingSettlement.count,
    riskCount: overtime.over48HoursPendingVerify.length + overtime.over15DaysPendingSettlement.length
  }

  // 资金池分布
  capitalDistribution.value = [
    { name: '待确认收款', value: capitalData.pendingVerify.amount, count: capitalData.pendingVerify.count, color: '#faad14' },
    { name: '已确认待发货', value: capitalData.pendingShip.amount, count: capitalData.pendingShip.count, color: '#1890ff' },
    { name: '已发货待验收', value: capitalData.pendingAcceptance.amount, count: capitalData.pendingAcceptance.count, color: '#722ed1' },
    { name: '待结算', value: capitalData.pendingSettlement.amount, count: capitalData.pendingSettlement.count, color: '#52c41a' }
  ]

  // 计算效率
  const verifyOrders = orders.filter(o => o.verifyTime)
  const verifyOnTime = verifyOrders.filter(o => {
    const createTime = new Date(o.createTime || o.submitVoucherTime)
    const verifyTime = new Date(o.verifyTime)
    const hours = (verifyTime - createTime) / (1000 * 60 * 60)
    return hours <= 24
  })

  efficiency.value.verifyRate = verifyOrders.length > 0
    ? Math.round((verifyOnTime.length / verifyOrders.length) * 100)
    : 0
  efficiency.value.disputeRate = 95 // 简化
  efficiency.value.settlementRate = 88 // 简化
}

// 格式化金额
const formatAmount = (amount) => {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`
  }
  return amount?.toLocaleString('zh-CN', { minimumFractionDigits: 0 }) || '0'
}

// 刷新数据
const refreshing = ref(false)
const handleRefresh = () => {
  refreshing.value = true
  loadData()
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

// 跳转到对应的业务页面
const goToPage = (statusName) => {
  switch (statusName) {
    case '待确认收款':
      router.push('/agent/pending-verify')
      break
    case '已确认待发货':
      router.push('/seller/orders')
      break
    case '已发货待验收':
      router.push('/order/list')
      break
    case '待结算':
      router.push('/agent/settlement')
      break
    default:
      break
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="report-professional">
    <!-- 顶部标题栏 -->
    <div class="report-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <h1>B2B托管交易监控看板</h1>
            <p class="subtitle">Escrow Transaction Monitoring Dashboard</p>
          </div>
          <div class="header-right">
            <span class="update-time">数据更新时间：{{ new Date().toLocaleString('zh-CN') }}</span>
            <el-button :icon="Refresh" :loading="refreshing" @click="handleRefresh" type="primary">
              刷新数据
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- 核心KPI指标 -->
      <div class="kpi-section">
        <div class="kpi-card primary">
          <div class="kpi-label">监管资金总额</div>
          <div class="kpi-value">¥{{ formatAmount(kpiData.totalCapital) }}</div>
          <div class="kpi-desc">Total Capital Under Custody</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">今日流入</div>
          <div class="kpi-value green">+¥{{ formatAmount(kpiData.todayInflow) }}</div>
          <div class="kpi-desc">Today's Inflow</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">今日流出</div>
          <div class="kpi-value red">-¥{{ formatAmount(kpiData.todayOutflow) }}</div>
          <div class="kpi-desc">Today's Outflow</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">平均占用周期</div>
          <div class="kpi-value">{{ kpiData.avgCycle }}<span class="unit">天</span></div>
          <div class="kpi-desc">Avg. Capital Cycle</div>
        </div>

        <div
          class="kpi-card clickable"
          @click="router.push('/agent')"
          title="点击查看待处理业务"
        >
          <div class="kpi-label">待处理业务</div>
          <div class="kpi-value orange">{{ kpiData.pendingCount }}<span class="unit">笔</span></div>
          <div class="kpi-desc">Pending Tasks</div>
        </div>

        <div
          class="kpi-card clickable"
          :class="{ alert: kpiData.riskCount > 0 }"
          @click="router.push('/agent/pending-verify')"
          title="点击查看风险预警详情"
        >
          <div class="kpi-label">风险预警</div>
          <div class="kpi-value" :class="{ red: kpiData.riskCount > 0 }">
            {{ kpiData.riskCount }}<span class="unit">项</span>
          </div>
          <div class="kpi-desc">Risk Alerts</div>
        </div>
      </div>

      <!-- 资金池分布 -->
      <div class="main-section">
        <div class="section-title">
          <h2>资金池状态分布</h2>
          <p>Capital Pool Distribution by Status</p>
        </div>

        <div class="distribution-grid">
          <div
            v-for="item in capitalDistribution"
            :key="item.name"
            class="distribution-card clickable"
            @click="goToPage(item.name)"
            :title="`点击查看${item.name}列表`"
          >
            <div class="card-header">
              <div class="status-indicator" :style="{ background: item.color }"></div>
              <span class="status-name">{{ item.name }}</span>
            </div>
            <div class="card-amount">¥{{ formatAmount(item.value) }}</div>
            <div class="card-count">{{ item.count }}笔交易</div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: `${(item.value / kpiData.totalCapital * 100)}%`,
                  background: item.color
                }"
              ></div>
            </div>
            <div class="percentage">
              {{ ((item.value / kpiData.totalCapital * 100) || 0).toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 业务处理效率 -->
      <div class="efficiency-section">
        <div class="section-title">
          <h2>业务处理效率</h2>
          <p>Operational Efficiency Metrics</p>
        </div>

        <div class="efficiency-grid">
          <div class="efficiency-card">
            <div class="efficiency-header">
              <span>收款确认及时率</span>
              <span class="standard">（标准：24小时）</span>
            </div>
            <div class="efficiency-value">
              <span class="rate" :class="getRateClass(efficiency.verifyRate)">
                {{ efficiency.verifyRate }}%
              </span>
              <div class="rate-bar">
                <div
                  class="rate-fill"
                  :class="getRateClass(efficiency.verifyRate)"
                  :style="{ width: `${efficiency.verifyRate}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="efficiency-card">
            <div class="efficiency-header">
              <span>争议响应及时率</span>
              <span class="standard">（标准：48小时）</span>
            </div>
            <div class="efficiency-value">
              <span class="rate" :class="getRateClass(efficiency.disputeRate)">
                {{ efficiency.disputeRate }}%
              </span>
              <div class="rate-bar">
                <div
                  class="rate-fill"
                  :class="getRateClass(efficiency.disputeRate)"
                  :style="{ width: `${efficiency.disputeRate}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="efficiency-card">
            <div class="efficiency-header">
              <span>结算执行及时率</span>
              <span class="standard">（标准：7天）</span>
            </div>
            <div class="efficiency-value">
              <span class="rate" :class="getRateClass(efficiency.settlementRate)">
                {{ efficiency.settlementRate }}%
              </span>
              <div class="rate-bar">
                <div
                  class="rate-fill"
                  :class="getRateClass(efficiency.settlementRate)"
                  :style="{ width: `${efficiency.settlementRate}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 资金流动趋势图 -->
      <TrendChart />
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    getRateClass(rate) {
      if (rate >= 90) return 'excellent'
      if (rate >= 80) return 'good'
      if (rate >= 60) return 'fair'
      return 'poor'
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

// 专业配色方案
$primary-blue: #1890ff;
$success-green: #52c41a;
$warning-orange: #faad14;
$danger-red: #ff4d4f;
$text-title: #262626;
$text-main: #595959;
$text-sub: #8c8c8c;
$border-color: #e8e8e8;
$bg-gray: #fafafa;

.report-professional {
  min-height: 100vh;
  background: #f5f5f5;

  .report-header {
    background: white;
    border-bottom: 1px solid $border-color;
    padding: 24px 0;
    margin-bottom: 24px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h1 {
          font-size: 24px;
          font-weight: 600;
          color: $text-title;
          margin: 0 0 4px 0;
        }

        .subtitle {
          font-size: 13px;
          color: $text-sub;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;

        .update-time {
          font-size: 13px;
          color: $text-sub;
        }
      }
    }
  }

  // KPI指标卡片
  .kpi-section {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .kpi-card {
      background: white;
      border: 1px solid $border-color;
      border-radius: 4px;
      padding: 20px 16px;
      text-align: center;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      &.clickable {
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: $primary-blue;
        }
      }

      &.primary {
        background: linear-gradient(135deg, $primary-blue 0%, #40a9ff 100%);
        border: none;
        color: white;

        .kpi-label,
        .kpi-value,
        .kpi-desc {
          color: white;
        }
      }

      &.alert {
        border-color: $danger-red;
        background: #fff1f0;
      }

      .kpi-label {
        font-size: 13px;
        color: $text-sub;
        margin-bottom: 8px;
      }

      .kpi-value {
        font-size: 28px;
        font-weight: 600;
        color: $text-title;
        margin-bottom: 4px;

        &.green {
          color: $success-green;
        }

        &.red {
          color: $danger-red;
        }

        &.orange {
          color: $warning-orange;
        }

        .unit {
          font-size: 14px;
          font-weight: 400;
          margin-left: 4px;
        }
      }

      .kpi-desc {
        font-size: 11px;
        color: $text-sub;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
    }
  }

  // 主要区域
  .main-section,
  .efficiency-section {
    background: white;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 24px;
    margin-bottom: 24px;

    .section-title {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid $border-color;

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: $text-title;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 12px;
        color: $text-sub;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }

  // 资金分布
  .distribution-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    .distribution-card {
      background: $bg-gray;
      border: 1px solid $border-color;
      border-radius: 4px;
      padding: 20px;
      transition: all 0.3s;

      &.clickable {
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          border-color: $primary-blue;

          .card-header .status-name {
            color: $primary-blue;
          }
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .status-name {
          font-size: 14px;
          font-weight: 500;
          color: $text-main;
        }
      }

      .card-amount {
        font-size: 24px;
        font-weight: 600;
        color: $text-title;
        margin-bottom: 4px;
      }

      .card-count {
        font-size: 13px;
        color: $text-sub;
        margin-bottom: 12px;
      }

      .progress-bar {
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }
      }

      .percentage {
        text-align: right;
        font-size: 12px;
        font-weight: 600;
        color: $text-main;
      }
    }
  }

  // 效率指标
  .efficiency-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    .efficiency-card {
      background: $bg-gray;
      border: 1px solid $border-color;
      border-radius: 4px;
      padding: 20px;

      .efficiency-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        span:first-child {
          font-size: 14px;
          font-weight: 500;
          color: $text-main;
        }

        .standard {
          font-size: 12px;
          color: $text-sub;
        }
      }

      .efficiency-value {
        .rate {
          display: block;
          font-size: 36px;
          font-weight: 600;
          margin-bottom: 12px;

          &.excellent {
            color: $success-green;
          }

          &.good {
            color: $primary-blue;
          }

          &.fair {
            color: $warning-orange;
          }

          &.poor {
            color: $danger-red;
          }
        }

        .rate-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;

          .rate-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.6s ease;

            &.excellent {
              background: $success-green;
            }

            &.good {
              background: $primary-blue;
            }

            &.fair {
              background: $warning-orange;
            }

            &.poor {
              background: $danger-red;
            }
          }
        }
      }
    }
  }
}
</style>
