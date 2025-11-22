<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Check, Close } from '@element-plus/icons-vue'
import { enrichOrder } from '@/utils/productApi'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'

const router = useRouter()

// 待仲裁订单列表
const arbitrationList = ref([])
const loading = ref(false)

// 确认对话框
const showConfirmDialog = ref(false)
const confirmAction = ref(null) // 'support' or 'reject'
const currentOrder = ref(null)
const processing = ref(false)

// 获取待仲裁订单列表
const fetchArbitrationOrders = async () => {
  loading.value = true
  try {
    const orders = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('order_')) {
        const orderData = localStorage.getItem(key)
        if (orderData) {
          const order = JSON.parse(orderData)
          // status: -2 表示"验收失败"需要仲裁
          if (order.status === -2) {
            orders.push(order)
          }
        }
      }
    }

    // 为所有订单获取完整商品信息
    const enrichedOrders = await Promise.all(
      orders.map(order => enrichOrder(order))
    )

    arbitrationList.value = enrichedOrders.sort((a, b) => {
      const timeA = new Date(a.acceptanceTime).getTime()
      const timeB = new Date(b.acceptanceTime).getTime()
      return timeB - timeA
    })
  } catch (error) {
    console.error('获取仲裁列表失败：', error)
    ElMessage.error('获取仲裁列表失败')
  } finally {
    loading.value = false
  }
}

// 查看仲裁详情
const viewArbitration = (order) => {
  router.push(`/agent/arbitration/${order.id}`)
}

// 快速支持买家
const supportBuyer = (order) => {
  currentOrder.value = order
  confirmAction.value = 'support'
  showConfirmDialog.value = true
}

// 执行支持买家
const executeSupportBuyer = async () => {
  processing.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 800))

    const updatedOrder = {
      ...currentOrder.value,
      status: -3,
      statusName: '仲裁完成(支持买家)',
      arbitrationTime: new Date().toLocaleString('zh-CN'),
      arbitrationResult: 'support_buyer'
    }

    localStorage.setItem(`order_${currentOrder.value.id}`, JSON.stringify(updatedOrder))
    ElMessage.success('已支持买家申请')
    showConfirmDialog.value = false
    fetchArbitrationOrders()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    processing.value = false
  }
}

// 快速驳回申请
const rejectClaim = (order) => {
  currentOrder.value = order
  confirmAction.value = 'reject'
  showConfirmDialog.value = true
}

// 执行驳回申请
const executeRejectClaim = async () => {
  processing.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 800))

    const updatedOrder = {
      ...currentOrder.value,
      status: 3,
      statusName: '待结算',
      arbitrationTime: new Date().toLocaleString('zh-CN'),
      arbitrationResult: 'reject_claim'
    }

    localStorage.setItem(`order_${currentOrder.value.id}`, JSON.stringify(updatedOrder))
    ElMessage.success('已驳回申请，订单进入待结算')
    showConfirmDialog.value = false
    fetchArbitrationOrders()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    processing.value = false
  }
}

// 获取确认对话框配置
const getConfirmConfig = () => {
  if (confirmAction.value === 'support') {
    return {
      title: '支持买家',
      message: '确认支持买家的仲裁申请吗？将要求卖家重新发货或退款。',
      type: 'danger',
      confirmText: '确认支持',
      handler: executeSupportBuyer
    }
  } else {
    return {
      title: '驳回申请',
      message: '确认驳回买家的仲裁申请吗？订单将进入待结算状态。',
      type: 'success',
      confirmText: '确认驳回',
      handler: executeRejectClaim
    }
  }
}

onMounted(() => {
  fetchArbitrationOrders()
})
</script>

<template>
  <div class="arbitration-list-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>验收仲裁</h2>
        <p class="subtitle">买家验收失败，需要经办人仲裁</p>
      </div>

      <!-- 统计 -->
      <div class="stats-bar">
        <div class="stat-item">
          待仲裁：<strong>{{ arbitrationList.length }}</strong> 单
        </div>
      </div>

      <!-- 仲裁列表 -->
      <div v-loading="loading" class="arbitration-list">
        <div v-if="arbitrationList.length > 0" class="arbitration-cards">
          <div
            v-for="order in arbitrationList"
            :key="order.id"
            class="arbitration-card"
          >
            <div class="card-header">
              <div class="order-info">
                <span class="order-sn">订单号：{{ order.orderSn }}</span>
                <el-tag type="danger" size="small">{{ order.statusName }}</el-tag>
              </div>
              <div class="time-info">
                验收时间：{{ order.acceptanceTime }}
              </div>
            </div>

            <div class="card-body">
              <div class="fail-reason">
                <div class="reason-label">失败原因：</div>
                <div class="reason-content">{{ order.failReason }}</div>
              </div>

              <div class="evidence-section">
                <div class="evidence-label">证据图片：</div>
                <div class="evidence-images">
                  <div
                    v-for="(img, index) in order.evidenceImages"
                    :key="index"
                    class="evidence-img"
                  >
                    <img :src="img" alt="证据" />
                  </div>
                </div>
              </div>

              <div class="order-amount">
                订单金额：<span class="amount">¥{{ order.payAmount?.toFixed(2) }}</span>
              </div>
            </div>

            <div class="card-footer">
              <el-button
                size="small"
                :icon="View"
                @click="viewArbitration(order)"
              >
                查看详情
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Close"
                @click="supportBuyer(order)"
              >
                支持买家
              </el-button>
              <el-button
                type="success"
                size="small"
                :icon="Check"
                @click="rejectClaim(order)"
              >
                驳回申请
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-else-if="!loading" description="暂无待仲裁的订单" />
      </div>

      <!-- 确认对话框 -->
      <ConfirmDialog
        v-if="showConfirmDialog"
        v-model="showConfirmDialog"
        :title="getConfirmConfig().title"
        :message="getConfirmConfig().message"
        :type="getConfirmConfig().type"
        :confirm-text="getConfirmConfig().confirmText"
        cancel-text="取消"
        :loading="processing"
        @confirm="getConfirmConfig().handler"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.arbitration-list-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
  padding: 40px 0;

  .page-header {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h2 {
      font-size: 28px;
      font-weight: bold;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: $text-secondary;
      margin: 0;
    }
  }

  .stats-bar {
    background: white;
    padding: 20px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    .stat-item {
      font-size: 14px;
      color: $text-secondary;

      strong {
        color: #f56c6c;
        font-size: 18px;
        margin: 0 4px;
      }
    }
  }

  .arbitration-list {
    min-height: 400px;

    .arbitration-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .arbitration-card {
        background: white;
        border-radius: $border-radius-base;
        border: 1px solid $border-light;
        overflow: hidden;

        .card-header {
          padding: 16px 24px;
          background: #fff1f0;
          border-bottom: 1px solid $border-light;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .order-info {
            display: flex;
            align-items: center;
            gap: 16px;

            .order-sn {
              font-size: 14px;
              color: $text-primary;
              font-weight: 500;
            }
          }

          .time-info {
            font-size: 12px;
            color: $text-placeholder;
          }
        }

        .card-body {
          padding: 20px 24px;

          .fail-reason {
            margin-bottom: 16px;
            padding: 12px;
            background: #fff7e6;
            border-left: 4px solid #faad14;
            border-radius: 4px;

            .reason-label {
              font-size: 13px;
              color: #d46b08;
              font-weight: 500;
              margin-bottom: 8px;
            }

            .reason-content {
              font-size: 14px;
              color: $text-primary;
              line-height: 1.6;
            }
          }

          .evidence-section {
            margin-bottom: 16px;

            .evidence-label {
              font-size: 13px;
              color: $text-secondary;
              margin-bottom: 12px;
            }

            .evidence-images {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;

              .evidence-img {
                width: 100px;
                height: 100px;
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid $border-light;
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                  transform: scale(1.05);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
              }
            }
          }

          .order-amount {
            font-size: 14px;
            color: $text-secondary;

            .amount {
              color: $primary-color;
              font-size: 18px;
              font-weight: 500;
              margin-left: 8px;
            }
          }
        }

        .card-footer {
          padding: 16px 24px;
          background: #fafafa;
          border-top: 1px solid $border-light;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      }
    }
  }
}
</style>
