<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Warning, Bell, InfoFilled, CircleCheck } from '@element-plus/icons-vue'
import { getOvertimeOrders, getDisputeOrders } from '@/utils/reportData'

const router = useRouter()

// 预警数据
const alerts = ref({
  critical: [],  // 紧急
  warning: [],   // 警告
  info: []       // 提醒
})
const loading = ref(true)

// 加载预警数据
const loadAlerts = async () => {
  try {
    loading.value = true
    console.log('开始加载预警数据...')

    const [overtime, disputes] = await Promise.all([
      getOvertimeOrders(),
      getDisputeOrders()
    ])

    console.log('预警数据加载完成:', { 超时订单: overtime, 争议订单: disputes.length })

  alerts.value = {
    critical: [],
    warning: [],
    info: []
  }

  // 🔴 紧急 - 超48小时未确认收款
  if (overtime.over48HoursPendingVerify.length > 0) {
    const totalAmount = overtime.over48HoursPendingVerify.reduce((sum, order) => sum + (order.payAmount || 0), 0)
    alerts.value.critical.push({
      id: 'over48h',
      type: 'critical',
      icon: 'danger',
      title: '超48小时未确认收款',
      count: overtime.over48HoursPendingVerify.length,
      amount: totalAmount,
      action: '立即处理',
      route: '/agent/pending-verify',
      orders: overtime.over48HoursPendingVerify
    })
  }

  // 🔴 紧急 - 超15天未结算
  if (overtime.over15DaysPendingSettlement.length > 0) {
    const totalAmount = overtime.over15DaysPendingSettlement.reduce((sum, order) => sum + (order.payAmount || 0), 0)
    const maxDays = Math.max(...overtime.over15DaysPendingSettlement.map(o => o.overtimeDays))
    alerts.value.critical.push({
      id: 'over15days',
      type: 'critical',
      icon: 'danger',
      title: `超15天未结算卖家 (最长${maxDays}天)`,
      count: overtime.over15DaysPendingSettlement.length,
      amount: totalAmount,
      action: '查看结算',
      route: '/agent/settlement',
      orders: overtime.over15DaysPendingSettlement
    })
  }

  // 🔴 紧急 - 高额争议订单
  const highValueDisputes = disputes.filter(order => (order.payAmount || 0) >= 100000)
  if (highValueDisputes.length > 0) {
    const totalAmount = highValueDisputes.reduce((sum, order) => sum + (order.payAmount || 0), 0)
    alerts.value.critical.push({
      id: 'highDispute',
      type: 'critical',
      icon: 'danger',
      title: '高额争议订单 (≥10万)',
      count: highValueDisputes.length,
      amount: totalAmount,
      action: '立即仲裁',
      route: '/agent/arbitration',
      orders: highValueDisputes
    })
  }

  // 🟡 警告 - 超24小时待确认
  if (overtime.over24HoursPendingVerify.length > 0) {
    const totalAmount = overtime.over24HoursPendingVerify.reduce((sum, order) => sum + (order.payAmount || 0), 0)
    alerts.value.warning.push({
      id: 'over24h',
      type: 'warning',
      icon: 'warning',
      title: '超24小时待确认',
      count: overtime.over24HoursPendingVerify.length,
      amount: totalAmount,
      action: '今日关注',
      route: '/agent/pending-verify',
      orders: overtime.over24HoursPendingVerify
    })
  }

  // 🟡 警告 - 验收超期未操作
  if (overtime.over7DaysPendingAcceptance.length > 0) {
    alerts.value.warning.push({
      id: 'over7daysAcceptance',
      type: 'warning',
      icon: 'warning',
      title: '验收超期未操作 (已发货>7天)',
      count: overtime.over7DaysPendingAcceptance.length,
      action: '提醒买家',
      orders: overtime.over7DaysPendingAcceptance
    })
  }

  // 🟡 警告 - 争议集中
  if (disputes.length > 3) {
    alerts.value.warning.push({
      id: 'disputeConcentrated',
      type: 'warning',
      icon: 'warning',
      title: '争议订单集中',
      count: disputes.length,
      action: '查看详情',
      route: '/agent/arbitration',
      orders: disputes
    })
  }

  // 🟢 提醒 - 如果没有紧急和警告，显示正常状态
  if (alerts.value.critical.length === 0 && alerts.value.warning.length === 0) {
    alerts.value.info.push({
      id: 'allGood',
      type: 'info',
      icon: 'success',
      title: '暂无异常',
      description: '系统运行正常，继续保持！'
    })
  }
  } catch (error) {
    console.error('加载预警数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 计算总预警数
const totalAlerts = computed(() => {
  return alerts.value.critical.length + alerts.value.warning.length
})

// 格式化金额
const formatAmount = (amount) => {
  return amount ? `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}` : ''
}

// 跳转到相关页面
const handleAlertAction = (alert) => {
  if (alert.route) {
    router.push(alert.route)
  }
}

onMounted(() => {
  loadAlerts()
})
</script>

<template>
  <div class="alert-radar">
    <div class="section-header">
      <div class="header-left">
        <el-icon :size="20" color="#ff4d4f"><Warning /></el-icon>
        <h3>异常预警雷达</h3>
      </div>
      <el-badge :value="totalAlerts" :max="99" v-if="totalAlerts > 0">
        <el-icon :size="24" color="#ff4d4f"><Bell /></el-icon>
      </el-badge>
    </div>

    <div class="alerts-container">
      <!-- 🔴 紧急预警 -->
      <div v-if="alerts.critical.length > 0" class="alert-section critical-section">
        <div class="section-title">
          <span class="title-badge critical">🔴 紧急</span>
          <span class="subtitle">需立即处理</span>
        </div>
        <div class="alert-list">
          <div
            v-for="alert in alerts.critical"
            :key="alert.id"
            class="alert-item critical-item"
            @click="handleAlertAction(alert)"
          >
            <div class="alert-icon">
              <el-icon :size="20" color="#ff4d4f"><Warning /></el-icon>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-meta">
                <span class="alert-count">{{ alert.count }}笔</span>
                <span v-if="alert.amount" class="alert-amount">合计{{ formatAmount(alert.amount) }}</span>
              </div>
            </div>
            <el-button type="danger" size="small" plain>
              {{ alert.action }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 🟡 警告 -->
      <div v-if="alerts.warning.length > 0" class="alert-section warning-section">
        <div class="section-title">
          <span class="title-badge warning">🟡 警告</span>
          <span class="subtitle">需今日关注</span>
        </div>
        <div class="alert-list">
          <div
            v-for="alert in alerts.warning"
            :key="alert.id"
            class="alert-item warning-item"
            @click="handleAlertAction(alert)"
          >
            <div class="alert-icon">
              <el-icon :size="20" color="#faad14"><InfoFilled /></el-icon>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-meta">
                <span class="alert-count">{{ alert.count }}笔</span>
                <span v-if="alert.amount" class="alert-amount">合计{{ formatAmount(alert.amount) }}</span>
              </div>
            </div>
            <el-button type="warning" size="small" plain>
              {{ alert.action }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 🟢 正常状态 -->
      <div v-if="alerts.info.length > 0" class="alert-section info-section">
        <div class="all-good-message">
          <el-icon :size="48" color="#52c41a"><CircleCheck /></el-icon>
          <div class="message-text">
            <h4>{{ alerts.info[0].title }}</h4>
            <p>{{ alerts.info[0].description }}</p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="totalAlerts === 0 && alerts.info.length === 0" class="empty-alerts">
        <el-empty description="正在加载预警数据..." />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.alert-radar {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 100%;
  display: flex;
  flex-direction: column;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f0f0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin: 0;
      }
    }
  }

  .alerts-container {
    flex: 1;
    overflow-y: auto;

    .alert-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .title-badge {
          font-size: 13px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;

          &.critical {
            background: #fff1f0;
            color: #cf1322;
          }

          &.warning {
            background: #fffbe6;
            color: #d46b08;
          }
        }

        .subtitle {
          font-size: 12px;
          color: $text-placeholder;
        }
      }

      .alert-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .alert-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &.critical-item {
            background: #fff1f0;
            border-left: 4px solid #ff4d4f;

            &:hover {
              background: #ffccc7;
              transform: translateX(4px);
            }
          }

          &.warning-item {
            background: #fffbe6;
            border-left: 4px solid #faad14;

            &:hover {
              background: #ffe58f;
              transform: translateX(4px);
            }
          }

          .alert-icon {
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .alert-content {
            flex: 1;
            min-width: 0;

            .alert-title {
              font-size: 14px;
              font-weight: 500;
              color: $text-primary;
              margin-bottom: 4px;
            }

            .alert-meta {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 12px;

              .alert-count {
                color: $text-secondary;
              }

              .alert-amount {
                color: #ff4d4f;
                font-weight: 500;
              }
            }
          }

          .el-button {
            flex-shrink: 0;
          }
        }
      }
    }

    .all-good-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
      border-radius: 12px;
      text-align: center;

      .message-text {
        margin-top: 16px;

        h4 {
          font-size: 18px;
          color: #52c41a;
          margin: 0 0 8px 0;
        }

        p {
          font-size: 14px;
          color: $text-secondary;
          margin: 0;
        }
      }
    }

    .empty-alerts {
      padding: 40px 0;
    }
  }
}
</style>
