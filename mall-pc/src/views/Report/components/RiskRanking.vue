<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Warning, ArrowRight } from '@element-plus/icons-vue'
import { getAllB2BOrders } from '@/utils/reportData'

const router = useRouter()

// 风险订单列表
const riskOrders = ref([])

// 计算订单风险评分
const calculateRiskScore = (order) => {
  let score = 0
  const now = new Date()
  const createTime = new Date(order.createTime || order.submitVoucherTime)
  const hoursSinceCreate = (now - createTime) / (1000 * 60 * 60)
  const daysSinceCreate = hoursSinceCreate / 24

  // 1. 金额风险 (最高30分)
  const amount = order.payAmount || 0
  if (amount >= 100000) score += 30
  else if (amount >= 50000) score += 20
  else if (amount >= 20000) score += 10

  // 2. 时间风险 (最高25分)
  if (order.status === 0) {
    // 待确认收款
    if (hoursSinceCreate > 48) score += 25
    else if (hoursSinceCreate > 24) score += 15
    else if (hoursSinceCreate > 12) score += 8
  }

  if (order.status === 3) {
    // 待结算
    if (daysSinceCreate > 15) score += 25
    else if (daysSinceCreate > 10) score += 15
    else if (daysSinceCreate > 7) score += 8
  }

  if (order.status === 2 && order.shipTime) {
    // 已发货待验收
    const daysSinceShip = (now - new Date(order.shipTime)) / (1000 * 60 * 60 * 24)
    if (daysSinceShip > 7) score += 20
    else if (daysSinceShip > 5) score += 10
  }

  // 3. 状态风险 (最高20分)
  if (order.status === -1) score += 15 // 付款驳回
  if (order.status === -2) score += 20 // 验收失败
  if (order.status === 0) score += 10 // 待确认

  // 4. 历史风险 (最高15分)
  if (order.rejectReason) score += 10 // 曾被驳回
  if (order.failReason) score += 15 // 曾验收失败

  // 5. 新客户风险 (最高10分)
  // 简化处理：如果订单创建时间很近，认为是新客户
  if (daysSinceCreate < 1) score += 10

  return Math.min(score, 100) // 最高100分
}

// 获取风险等级
const getRiskLevel = (score) => {
  if (score >= 70) return { level: '高危', class: 'critical', color: '#ff4d4f' }
  if (score >= 50) return { level: '警告', class: 'warning', color: '#faad14' }
  if (score >= 30) return { level: '关注', class: 'notice', color: '#1890ff' }
  return { level: '正常', class: 'normal', color: '#52c41a' }
}

// 获取风险因素
const getRiskFactors = (order) => {
  const factors = []
  const now = new Date()
  const createTime = new Date(order.createTime || order.submitVoucherTime)
  const hoursSinceCreate = (now - createTime) / (1000 * 60 * 60)
  const daysSinceCreate = hoursSinceCreate / 24

  if ((order.payAmount || 0) >= 100000) factors.push('高额交易')
  if (order.status === 0 && hoursSinceCreate > 24) factors.push('确认超时')
  if (order.status === 3 && daysSinceCreate > 10) factors.push('结算延迟')
  if (order.status === -2) factors.push('验收失败')
  if (order.rejectReason) factors.push('曾被驳回')
  if (daysSinceCreate < 1) factors.push('新客户')

  return factors
}

// 加载数据
const loadData = () => {
  const orders = getAllB2BOrders()

  // 只取未完成的订单
  const activeOrders = orders.filter(order => order.status !== 4)

  // 计算风险评分
  const ordersWithRisk = activeOrders.map(order => ({
    ...order,
    riskScore: calculateRiskScore(order),
    riskLevel: getRiskLevel(calculateRiskScore(order)),
    riskFactors: getRiskFactors(order)
  }))

  // 按风险评分排序，取前10
  riskOrders.value = ordersWithRisk
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
}

// 格式化金额
const formatAmount = (amount) => {
  return amount ? `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}` : '¥0'
}

// 查看订单详情
const viewOrder = (order) => {
  // 根据订单状态跳转到相应页面
  if (order.status === 0) {
    router.push(`/agent/verify/${order.id}`)
  } else if (order.status === -2) {
    router.push('/agent/arbitration')
  } else if (order.status === 3) {
    router.push(`/agent/settlement/${order.id}`)
  } else {
    router.push(`/order/detail/${order.id}`)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="risk-ranking">
    <div class="section-header">
      <div class="header-left">
        <el-icon :size="20" color="#ff4d4f"><Warning /></el-icon>
        <div class="header-text">
          <h3>订单风险评分 TOP 10</h3>
          <p class="subtitle">High Risk Orders Ranking</p>
        </div>
      </div>
      <div class="legend">
        <span class="legend-item critical">高危 ≥70</span>
        <span class="legend-item warning">警告 ≥50</span>
        <span class="legend-item notice">关注 ≥30</span>
      </div>
    </div>

    <div class="risk-list">
      <div
        v-for="(order, index) in riskOrders"
        :key="order.id"
        class="risk-item"
        :class="order.riskLevel.class"
        @click="viewOrder(order)"
      >
        <!-- 排名 -->
        <div class="rank" :class="{ top3: index < 3 }">
          {{ index + 1 }}
        </div>

        <!-- 订单信息 -->
        <div class="order-info">
          <div class="order-header">
            <span class="order-sn">{{ order.orderSn }}</span>
            <el-tag :type="order.riskLevel.class === 'critical' ? 'danger' : order.riskLevel.class === 'warning' ? 'warning' : 'info'" size="small">
              {{ order.statusName }}
            </el-tag>
          </div>
          <div class="order-meta">
            <span class="amount">{{ formatAmount(order.payAmount) }}</span>
            <span class="date">{{ order.createTime }}</span>
          </div>
          <div class="risk-factors">
            <el-tag
              v-for="factor in order.riskFactors"
              :key="factor"
              size="small"
              type="info"
              effect="plain"
            >
              {{ factor }}
            </el-tag>
          </div>
        </div>

        <!-- 风险评分 -->
        <div class="risk-score-container">
          <div class="score-circle" :style="{ borderColor: order.riskLevel.color }">
            <div class="score-value" :style="{ color: order.riskLevel.color }">
              {{ order.riskScore }}
            </div>
            <div class="score-label">分</div>
          </div>
          <div class="risk-level" :style="{ color: order.riskLevel.color }">
            {{ order.riskLevel.level }}
          </div>
        </div>

        <!-- 操作 -->
        <div class="action">
          <el-icon :size="20" color="#8c8c8c"><ArrowRight /></el-icon>
        </div>
      </div>

      <div v-if="riskOrders.length === 0" class="empty-state">
        <el-empty description="暂无风险订单">
          <template #image>
            <div style="font-size: 48px;">✓</div>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.risk-ranking {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

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

      .header-text {
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
    }

    .legend {
      display: flex;
      gap: 12px;

      .legend-item {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 500;

        &.critical {
          background: #fff1f0;
          color: #cf1322;
        }

        &.warning {
          background: #fffbe6;
          color: #d46b08;
        }

        &.notice {
          background: #e6f7ff;
          color: #0050b3;
        }
      }
    }
  }

  .risk-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 600px;
    overflow-y: auto;

    .risk-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      border: 2px solid;
      cursor: pointer;
      transition: all 0.3s;

      &.critical {
        background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
        border-color: #ff4d4f;

        &:hover {
          background: #ffccc7;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
        }
      }

      &.warning {
        background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%);
        border-color: #faad14;

        &:hover {
          background: #ffe58f;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(250, 173, 20, 0.2);
        }
      }

      &.notice {
        background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
        border-color: #1890ff;

        &:hover {
          background: #bae7ff;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
        }
      }

      &.normal {
        background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
        border-color: #52c41a;

        &:hover {
          background: #d9f7be;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(82, 196, 26, 0.2);
        }
      }

      .rank {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        color: $text-secondary;
        flex-shrink: 0;

        &.top3 {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #873800;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
        }
      }

      .order-info {
        flex: 1;
        min-width: 0;

        .order-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .order-sn {
            font-size: 14px;
            font-weight: 600;
            color: $text-primary;
          }
        }

        .order-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 13px;

          .amount {
            color: #ff4d4f;
            font-weight: 600;
          }

          .date {
            color: $text-placeholder;
          }
        }

        .risk-factors {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      }

      .risk-score-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;

        .score-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 3px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;

          .score-value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1;
          }

          .score-label {
            font-size: 11px;
            color: $text-placeholder;
          }
        }

        .risk-level {
          font-size: 13px;
          font-weight: 600;
        }
      }

      .action {
        flex-shrink: 0;
      }
    }

    .empty-state {
      padding: 40px 0;
    }
  }
}
</style>
