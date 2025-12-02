<script setup>
import { ref, onMounted, computed } from 'vue'
import { TrendCharts, Wallet, CircleCheck, ArrowUp, ArrowDown, Loading } from '@element-plus/icons-vue'
import { getCapitalByStatus, getTodayStats, getAverageCycleDays, generateMockOrdersIfNeeded } from '@/utils/reportData'

// 资金数据
const capitalData = ref(null)
const todayStats = ref(null)
const avgCycleDays = ref(0)
const loading = ref(true)

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    console.log('开始加载资金池数据...')

    // 不再需要生成Mock数据,直接从API获取
    // generateMockOrdersIfNeeded()

    // 并行加载所有数据
    const [capital, today, avgDays] = await Promise.all([
      getCapitalByStatus(),
      getTodayStats(),
      getAverageCycleDays()
    ])

    capitalData.value = capital
    todayStats.value = today
    avgCycleDays.value = avgDays

    console.log('资金池数据加载完成:', {
      总资金: capital.total,
      总笔数: capital.totalCount,
      今日确认: today.todayVerified.count,
      今日结算: today.todaySettled.count,
      平均周期: avgDays
    })
  } catch (error) {
    console.error('加载资金池数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 格式化金额
const formatAmount = (amount) => {
  return amount ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'
}

// 资金净流入状态
const netInflowStatus = computed(() => {
  if (!todayStats.value) return 'neutral'
  return todayStats.value.netInflow > 0 ? 'positive' : todayStats.value.netInflow < 0 ? 'negative' : 'neutral'
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="capital-overview">
    <div class="section-header">
      <div class="header-icon">
        <el-icon :size="24" color="#667eea"><Wallet /></el-icon>
      </div>
      <div class="header-text">
        <h2>资金池实时监控</h2>
        <p>Today's Capital Pool Status</p>
      </div>
    </div>

    <div v-if="capitalData" class="overview-content">
      <!-- 总资金卡片 -->
      <div class="total-capital-card">
        <div class="card-icon">
          <el-icon :size="40"><Wallet /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">监管中总资金</div>
          <div class="card-amount">¥{{ formatAmount(capitalData.total) }}</div>
          <div class="card-count">共 {{ capitalData.totalCount }} 笔订单</div>
        </div>
      </div>

      <!-- 各状态资金分布 -->
      <div class="status-grid">
        <!-- 待确认收款 -->
        <div class="status-card urgent">
          <div class="status-header">
            <span class="status-name">待确认收款</span>
            <el-tag type="danger" size="small" effect="dark">紧急</el-tag>
          </div>
          <div class="status-amount">¥{{ formatAmount(capitalData.pendingVerify.amount) }}</div>
          <div class="status-count">{{ capitalData.pendingVerify.count }} 笔</div>
          <div class="status-bar" style="background: linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%);"></div>
        </div>

        <!-- 已确认待发货 -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-name">已确认待发货</span>
          </div>
          <div class="status-amount">¥{{ formatAmount(capitalData.pendingShip.amount) }}</div>
          <div class="status-count">{{ capitalData.pendingShip.count }} 笔</div>
          <div class="status-bar" style="background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);"></div>
        </div>

        <!-- 已发货待验收 -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-name">已发货待验收</span>
          </div>
          <div class="status-amount">¥{{ formatAmount(capitalData.pendingAcceptance.amount) }}</div>
          <div class="status-count">{{ capitalData.pendingAcceptance.count }} 笔</div>
          <div class="status-bar" style="background: linear-gradient(90deg, #faad14 0%, #ffc53d 100%);"></div>
        </div>

        <!-- 验收通过待结算 -->
        <div class="status-card warning">
          <div class="status-header">
            <span class="status-name">验收通过待结算</span>
            <el-tag type="warning" size="small">关注</el-tag>
          </div>
          <div class="status-amount">¥{{ formatAmount(capitalData.pendingSettlement.amount) }}</div>
          <div class="status-count">{{ capitalData.pendingSettlement.count }} 笔</div>
          <div class="status-bar" style="background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);"></div>
        </div>
      </div>

      <!-- 资金效率指标 -->
      <div class="efficiency-metrics">
        <div class="metrics-header">
          <el-icon :size="20" color="#667eea"><TrendCharts /></el-icon>
          <span>资金效率指标</span>
        </div>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon :size="24" color="#fff"><CircleCheck /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">平均资金占用周期</div>
              <div class="metric-value">{{ avgCycleDays }} <span class="unit">天</span></div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-icon" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
              <el-icon :size="24" color="#fff"><ArrowDown /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">今日收款确认</div>
              <div class="metric-value">
                ¥{{ formatAmount(todayStats?.todayVerified.amount || 0) }}
                <span class="unit">({{ todayStats?.todayVerified.count || 0 }}笔)</span>
              </div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-icon" style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);">
              <el-icon :size="24" color="#fff"><ArrowUp /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">今日结算出账</div>
              <div class="metric-value">
                ¥{{ formatAmount(todayStats?.todaySettled.amount || 0) }}
                <span class="unit">({{ todayStats?.todaySettled.count || 0 }}笔)</span>
              </div>
            </div>
          </div>

          <div class="metric-item">
            <div
              class="metric-icon"
              :style="{
                background: netInflowStatus === 'positive'
                  ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                  : netInflowStatus === 'negative'
                  ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                  : 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)'
              }"
            >
              <el-icon :size="24" color="#fff"><TrendCharts /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">资金净流入</div>
              <div
                class="metric-value"
                :style="{
                  color: netInflowStatus === 'positive'
                    ? '#52c41a'
                    : netInflowStatus === 'negative'
                    ? '#ff4d4f'
                    : '#8c8c8c'
                }"
              >
                {{ netInflowStatus === 'positive' ? '+' : '' }}¥{{ formatAmount(todayStats?.netInflow || 0) }}
                <span class="status-icon">{{ netInflowStatus === 'positive' ? '✓' : netInflowStatus === 'negative' ? '✗' : '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>正在从API加载真实订单数据...</p>
    </div>

    <div v-else class="loading-state">
      <p>暂无数据</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.capital-overview {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;

    .header-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .header-text {
      h2 {
        font-size: 24px;
        font-weight: 700;
        color: $text-primary;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 13px;
        color: $text-placeholder;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }

  .overview-content {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .total-capital-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      display: flex;
      align-items: center;
      gap: 24px;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);

      .card-icon {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
      }

      .card-content {
        flex: 1;

        .card-label {
          font-size: 16px;
          opacity: 0.95;
          margin-bottom: 8px;
        }

        .card-amount {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif;
        }

        .card-count {
          font-size: 14px;
          opacity: 0.9;
        }
      }
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      .status-card {
        background: #fafafa;
        border-radius: 12px;
        padding: 20px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        &.urgent {
          background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
        }

        &.warning {
          background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .status-name {
            font-size: 13px;
            color: $text-secondary;
            font-weight: 500;
          }
        }

        .status-amount {
          font-size: 24px;
          font-weight: 700;
          color: $text-primary;
          margin-bottom: 4px;
        }

        .status-count {
          font-size: 12px;
          color: $text-placeholder;
          margin-bottom: 12px;
        }

        .status-bar {
          height: 4px;
          border-radius: 2px;
          margin-top: 12px;
        }
      }
    }

    .efficiency-metrics {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;

      .metrics-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;

        .metric-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 16px;
          border-radius: 8px;

          .metric-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .metric-content {
            flex: 1;
            min-width: 0;

            .metric-label {
              font-size: 12px;
              color: $text-secondary;
              margin-bottom: 4px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .metric-value {
              font-size: 18px;
              font-weight: 700;
              color: $text-primary;

              .unit {
                font-size: 12px;
                font-weight: 400;
                color: $text-placeholder;
                margin-left: 4px;
              }

              .status-icon {
                margin-left: 8px;
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }

  .loading-state {
    text-align: center;
    padding: 60px 0;
    color: $text-placeholder;

    p {
      margin-top: 16px;
      font-size: 14px;
    }
  }
}
</style>
