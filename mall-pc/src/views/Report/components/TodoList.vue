<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { List, Timer, Warning, Coin } from '@element-plus/icons-vue'
import { getCapitalByStatus, getDisputeOrders, getOvertimeOrders } from '@/utils/reportData'

const router = useRouter()

// 待办数据
const todos = ref({
  pendingVerify: { count: 0, urgent: 0, high: 0, normal: 0, route: '/agent/pending-verify' },
  disputes: { count: 0, quality: 0, quantity: 0, logistics: 0, route: '/agent/arbitration' },
  pendingSettlement: { count: 0, overdue: 0, normal: 0, route: '/agent/settlement' }
})

// 预估工作量
const estimatedHours = ref(0)
const loading = ref(true)

// 加载待办数据
const loadTodos = async () => {
  try {
    loading.value = true
    console.log('开始加载待办事项...')

    const [capitalData, disputes, overtime] = await Promise.all([
      getCapitalByStatus(),
      getDisputeOrders(),
      getOvertimeOrders()
    ])

    console.log('待办数据加载完成:', {
      待确认: capitalData.pendingVerify.count,
      争议: disputes.length,
      待结算: capitalData.pendingSettlement.count
    })

  // 收款确认
  todos.value.pendingVerify = {
    count: capitalData.pendingVerify.count,
    urgent: overtime.over48HoursPendingVerify.length, // 超时48小时
    high: capitalData.pendingVerify.orders.filter(o => (o.payAmount || 0) >= 50000).length, // 高额≥5万
    normal: 0,
    route: '/agent/pending-verify'
  }
  todos.value.pendingVerify.normal = todos.value.pendingVerify.count - todos.value.pendingVerify.urgent - todos.value.pendingVerify.high

  // 争议仲裁
  const activeDisputes = disputes.filter(order => order.status === -2) // 只统计验收失败待仲裁
  todos.value.disputes = {
    count: activeDisputes.length,
    quality: activeDisputes.filter(o => o.failReason && o.failReason.includes('质量')).length,
    quantity: activeDisputes.filter(o => o.failReason && o.failReason.includes('数量')).length,
    logistics: activeDisputes.filter(o => o.failReason && (o.failReason.includes('物流') || o.failReason.includes('损坏'))).length,
    route: '/agent/arbitration'
  }

  // 待结算审核
  todos.value.pendingSettlement = {
    count: capitalData.pendingSettlement.count,
    overdue: overtime.over15DaysPendingSettlement.length,
    normal: 0,
    route: '/agent/settlement'
  }
  todos.value.pendingSettlement.normal = todos.value.pendingSettlement.count - todos.value.pendingSettlement.overdue

  // 预估工作量
  // 收款确认: 15笔/小时 = 0.067小时/笔
  // 争议处理: 1.2笔/小时 = 0.833小时/笔
  // 结算操作: 15笔/小时 = 0.067小时/笔
  const verifyHours = todos.value.pendingVerify.count * 0.067
  const disputeHours = todos.value.disputes.count * 0.833
  const settlementHours = todos.value.pendingSettlement.count * 0.067

  estimatedHours.value = (verifyHours + disputeHours + settlementHours).toFixed(1)
  } catch (error) {
    console.error('加载待办数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 总待办数
const totalTodos = computed(() => {
  return todos.value.pendingVerify.count + todos.value.disputes.count + todos.value.pendingSettlement.count
})

// 跳转到对应页面
const goToPage = (route) => {
  router.push(route)
}

onMounted(() => {
  loadTodos()
})
</script>

<template>
  <div class="todo-list">
    <div class="section-header">
      <div class="header-left">
        <el-icon :size="20" color="#1890ff"><List /></el-icon>
        <h3>今日工作清单</h3>
      </div>
      <el-badge :value="totalTodos" :max="999" class="todo-badge">
        <el-tag type="primary" effect="dark">待处理</el-tag>
      </el-badge>
    </div>

    <div class="todos-container">
      <!-- ⏰ 收款确认 -->
      <div class="todo-section" @click="goToPage(todos.pendingVerify.route)">
        <div class="todo-header">
          <div class="header-left">
            <div class="icon-wrapper verify">
              <el-icon :size="24"><Timer /></el-icon>
            </div>
            <div class="header-text">
              <h4>收款确认</h4>
              <p>Payment Verification</p>
            </div>
          </div>
          <div class="header-right">
            <span class="count-badge">{{ todos.pendingVerify.count }}</span>
            <span class="unit">笔</span>
          </div>
        </div>

        <div class="todo-breakdown">
          <div v-if="todos.pendingVerify.urgent > 0" class="breakdown-item urgent">
            <span class="label">[紧急] 超时</span>
            <span class="value">{{ todos.pendingVerify.urgent }}笔</span>
          </div>
          <div v-if="todos.pendingVerify.high > 0" class="breakdown-item high">
            <span class="label">[高额] ≥¥50,000</span>
            <span class="value">{{ todos.pendingVerify.high }}笔</span>
          </div>
          <div v-if="todos.pendingVerify.normal > 0" class="breakdown-item normal">
            <span class="label">[常规]</span>
            <span class="value">{{ todos.pendingVerify.normal }}笔</span>
          </div>
        </div>

        <div class="todo-action">
          <el-button type="primary" size="small" plain>立即处理</el-button>
        </div>
      </div>

      <!-- ⚖️ 争议仲裁 -->
      <div class="todo-section" @click="goToPage(todos.disputes.route)">
        <div class="todo-header">
          <div class="header-left">
            <div class="icon-wrapper dispute">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="header-text">
              <h4>争议仲裁</h4>
              <p>Dispute Arbitration</p>
            </div>
          </div>
          <div class="header-right">
            <span class="count-badge">{{ todos.disputes.count }}</span>
            <span class="unit">笔</span>
          </div>
        </div>

        <div class="todo-breakdown">
          <div v-if="todos.disputes.quality > 0" class="breakdown-item">
            <span class="label">[质量问题]</span>
            <span class="value">{{ todos.disputes.quality }}笔</span>
          </div>
          <div v-if="todos.disputes.quantity > 0" class="breakdown-item">
            <span class="label">[数量短缺]</span>
            <span class="value">{{ todos.disputes.quantity }}笔</span>
          </div>
          <div v-if="todos.disputes.logistics > 0" class="breakdown-item">
            <span class="label">[物流损坏]</span>
            <span class="value">{{ todos.disputes.logistics }}笔</span>
          </div>
          <div v-if="todos.disputes.count === 0" class="no-items">
            <span>暂无争议订单</span>
          </div>
        </div>

        <div class="todo-action">
          <el-button type="warning" size="small" plain>查看详情</el-button>
        </div>
      </div>

      <!-- 💸 待结算审核 -->
      <div class="todo-section" @click="goToPage(todos.pendingSettlement.route)">
        <div class="todo-header">
          <div class="header-left">
            <div class="icon-wrapper settlement">
              <el-icon :size="24"><Coin /></el-icon>
            </div>
            <div class="header-text">
              <h4>待结算审核</h4>
              <p>Settlement Review</p>
            </div>
          </div>
          <div class="header-right">
            <span class="count-badge">{{ todos.pendingSettlement.count }}</span>
            <span class="unit">笔</span>
          </div>
        </div>

        <div class="todo-breakdown">
          <div v-if="todos.pendingSettlement.overdue > 0" class="breakdown-item urgent">
            <span class="label">[账期超标]</span>
            <span class="value">{{ todos.pendingSettlement.overdue }}笔</span>
          </div>
          <div v-if="todos.pendingSettlement.normal > 0" class="breakdown-item normal">
            <span class="label">[常规结算]</span>
            <span class="value">{{ todos.pendingSettlement.normal }}笔</span>
          </div>
          <div v-if="todos.pendingSettlement.count === 0" class="no-items">
            <span>暂无待结算订单</span>
          </div>
        </div>

        <div class="todo-action">
          <el-button type="success" size="small" plain>执行结算</el-button>
        </div>
      </div>

      <!-- 工作量预估 -->
      <div class="workload-summary">
        <div class="summary-icon">
          <el-icon :size="32" color="#667eea"><Timer /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-label">总计需处理</div>
          <div class="summary-value">
            <span class="total-count">{{ totalTodos }}</span>
            <span class="unit">笔</span>
          </div>
          <div class="summary-hours">
            预计工作量：<strong>{{ estimatedHours }}</strong> 小时
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.todo-list {
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

    .todo-badge {
      :deep(.el-tag) {
        font-size: 13px;
        padding: 6px 16px;
      }
    }
  }

  .todos-container {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .todo-section {
      background: linear-gradient(135deg, #f9fafb 0%, #f0f2f5 100%);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;

      &:hover {
        border-color: #667eea;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .todo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.verify {
              background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
            }

            &.dispute {
              background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
            }

            &.settlement {
              background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
            }
          }

          .header-text {
            h4 {
              font-size: 16px;
              font-weight: 600;
              color: $text-primary;
              margin: 0 0 4px 0;
            }

            p {
              font-size: 11px;
              color: $text-placeholder;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }

        .header-right {
          text-align: right;

          .count-badge {
            font-size: 32px;
            font-weight: 700;
            color: #667eea;
            line-height: 1;
          }

          .unit {
            font-size: 14px;
            color: $text-placeholder;
            margin-left: 4px;
          }
        }
      }

      .todo-breakdown {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        background: white;
        border-radius: 8px;

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 6px 8px;
          border-radius: 4px;
          background: #fafafa;

          &.urgent {
            background: #fff1f0;
            border-left: 3px solid #ff4d4f;

            .label {
              color: #cf1322;
              font-weight: 500;
            }

            .value {
              color: #ff4d4f;
              font-weight: 600;
            }
          }

          &.high {
            background: #fffbe6;
            border-left: 3px solid #faad14;

            .label {
              color: #d46b08;
              font-weight: 500;
            }

            .value {
              color: #faad14;
              font-weight: 600;
            }
          }

          &.normal {
            .label {
              color: $text-secondary;
            }

            .value {
              color: $text-primary;
              font-weight: 500;
            }
          }

          .label {
            color: $text-secondary;
          }

          .value {
            color: $text-primary;
            font-weight: 500;
          }
        }

        .no-items {
          text-align: center;
          padding: 8px;
          color: $text-placeholder;
          font-size: 12px;
        }
      }

      .todo-action {
        display: flex;
        justify-content: flex-end;

        .el-button {
          min-width: 100px;
        }
      }
    }

    .workload-summary {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);

      .summary-icon {
        width: 64px;
        height: 64px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
      }

      .summary-content {
        flex: 1;

        .summary-label {
          font-size: 13px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .summary-value {
          margin-bottom: 8px;

          .total-count {
            font-size: 36px;
            font-weight: 700;
            line-height: 1;
          }

          .unit {
            font-size: 16px;
            margin-left: 6px;
            opacity: 0.9;
          }
        }

        .summary-hours {
          font-size: 13px;
          opacity: 0.95;

          strong {
            font-size: 18px;
            font-weight: 700;
            margin: 0 4px;
          }
        }
      }
    }
  }
}
</style>
