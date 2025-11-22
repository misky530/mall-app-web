<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Check, Close } from '@element-plus/icons-vue'
import { ORDER_STATUS, getOrderStatusName, getOrderStatusTagType } from '@/utils/orderStatus'

const router = useRouter()

// 订单列表
const orderList = ref([])
// 加载状态
const loading = ref(false)

// 获取待确认收款订单列表（从localStorage读取）
const fetchOrderList = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    // 从localStorage读取所有订单
    const orders = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('order_')) {
        try {
          const orderData = localStorage.getItem(key)
          if (orderData) {
            const order = JSON.parse(orderData)
            // 只显示待确认收款的订单
            const orderStatus = order.status
            if (orderStatus === ORDER_STATUS.PAID_PENDING_VERIFY || orderStatus === 'PAID_PENDING_VERIFY') {
              // 确保有付款凭证
              if (order.paymentVouchers && order.paymentVouchers.length > 0) {
                // 添加买家信息
                if (!order.buyerName && order.receiverName) {
                  order.buyerName = order.receiverName + '（买家）'
                }
                // 确保商品图片正确
                if (order.items && order.items.length > 0) {
                  order.items.forEach(item => {
                    if (!item.productPic && item.pic) {
                      item.productPic = item.pic
                    }
                  })
                }
                orders.push(order)
              }
            }
          }
        } catch (error) {
          console.error(`解析订单数据失败: ${key}`, error)
        }
      }
    }

    // 按创建时间倒序排列
    orders.sort((a, b) => {
      const timeA = new Date(a.payTime || a.createTime || 0).getTime()
      const timeB = new Date(b.payTime || b.createTime || 0).getTime()
      return timeB - timeA
    })

    orderList.value = orders
  } catch (error) {
    console.error('获取订单列表失败：', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 确认收款
const handleConfirmPayment = async (order) => {
  ElMessageBox.confirm(
    `确认订单 ${order.orderSn} 的收款已到账？确认后将通知卖家发货。`,
    '确认收款',
    {
      confirmButtonText: '确认到账',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500))

        // 更新订单状态
        order.status = ORDER_STATUS.PROCESSING
        order.statusName = getOrderStatusName(ORDER_STATUS.PROCESSING)
        order.verifyTime = new Date().toLocaleString('zh-CN')

        // 保存到localStorage，确保卖家能看到
        localStorage.setItem(`order_${order.id}`, JSON.stringify(order))

        ElMessage.success('收款确认成功，已通知卖家发货')
        fetchOrderList()
      } catch (error) {
        console.error('确认收款失败：', error)
        ElMessage.error('确认失败，请重试')
      }
    })
    .catch(() => {
      // 取消
    })
}

// 驳回收款
const handleRejectPayment = async (order) => {
  ElMessageBox.prompt('请填写驳回原因', '驳回收款', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '请输入驳回原因，如：凭证造假、未查到账等'
  })
    .then(async ({ value }) => {
      if (!value || !value.trim()) {
        ElMessage.warning('请填写驳回原因')
        return
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 500))

        // 更新订单状态
        order.status = ORDER_STATUS.CREATED
        order.statusName = getOrderStatusName(ORDER_STATUS.CREATED)
        order.rejectReason = value
        order.rejectTime = new Date().toLocaleString('zh-CN')
        // 清空付款凭证，让买家重新上传
        order.paymentVouchers = []

        // 保存到localStorage
        localStorage.setItem(`order_${order.id}`, JSON.stringify(order))

        ElMessage.success('已驳回，买家需重新上传凭证')
        fetchOrderList()
      } catch (error) {
        console.error('驳回失败：', error)
        ElMessage.error('操作失败，请重试')
      }
    })
    .catch(() => {
      // 取消
    })
}

// 查看凭证
const handleViewVoucher = (voucher) => {
  // 打开图片预览
  window.open(voucher, '_blank')
}

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/80?text=暂无图片'
  e.target.onerror = null
}

onMounted(() => {
  fetchOrderList()
})
</script>

<template>
  <div class="payment-verify-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>财务审核 - 待确认收款</h2>
        <p class="page-desc">查看买家上传的付款凭证，核对银行到账情况后确认或驳回</p>
      </div>

      <div v-loading="loading" class="order-list">
        <div v-if="orderList.length === 0" class="empty-orders">
          <el-empty description="暂无待确认收款的订单" />
        </div>

        <div v-else>
          <div
            v-for="order in orderList"
            :key="order.id"
            class="order-item"
          >
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="order-info">
                <span class="order-sn">订单号：{{ order.orderSn }}</span>
                <span class="order-time">付款时间：{{ order.payTime }}</span>
              </div>
              <div class="order-status">
                <el-tag :type="getOrderStatusTagType(order.status)">
                  {{ order.statusName }}
                </el-tag>
              </div>
            </div>

            <!-- 订单信息 -->
            <div class="order-content">
              <div class="order-details">
                <div class="detail-row">
                  <span class="label">买家：</span>
                  <span class="value">{{ order.buyerName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">订单金额：</span>
                  <span class="value amount">¥{{ order.payAmount?.toFixed(2) }}</span>
                </div>
              </div>

              <!-- 付款凭证 -->
              <div class="voucher-section">
                <div class="voucher-title">付款凭证：</div>
                <div class="voucher-list">
                  <div
                    v-for="(voucher, index) in order.paymentVouchers"
                    :key="index"
                    class="voucher-item"
                    @click="handleViewVoucher(voucher)"
                  >
                    <img :src="voucher" alt="付款凭证" />
                    <div class="voucher-overlay">
                      <el-icon><View /></el-icon>
                      <span>查看大图</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="order-footer">
              <el-button
                type="success"
                :icon="Check"
                @click="handleConfirmPayment(order)"
              >
                确认到账
              </el-button>
              <el-button
                type="danger"
                :icon="Close"
                @click="handleRejectPayment(order)"
              >
                驳回
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.payment-verify-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .page-header {
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .page-desc {
      font-size: 14px;
      color: $text-secondary;
    }
  }

  .order-list {
    min-height: 400px;

    .empty-orders {
      background: white;
      border-radius: $border-radius-base;
      padding: 80px 20px;
    }

    .order-item {
      background: white;
      border-radius: $border-radius-base;
      margin-bottom: 16px;
      overflow: hidden;

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid $border-lighter;

        .order-info {
          display: flex;
          gap: 24px;
          font-size: 14px;

          .order-sn {
            color: $text-primary;
            font-weight: 500;
          }

          .order-time {
            color: $text-secondary;
          }
        }
      }

      .order-content {
        padding: 20px;

        .order-details {
          margin-bottom: 20px;

          .detail-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 14px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              color: $text-secondary;
              min-width: 100px;
            }

            .value {
              color: $text-primary;
              flex: 1;

              &.amount {
                font-size: 18px;
                font-weight: bold;
                color: $primary-color;
              }
            }
          }
        }

        .voucher-section {
          .voucher-title {
            font-size: 14px;
            font-weight: 500;
            color: $text-primary;
            margin-bottom: 12px;
          }

          .voucher-list {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;

            .voucher-item {
              position: relative;
              width: 200px;
              height: 150px;
              border-radius: $border-radius-small;
              overflow: hidden;
              border: 1px solid $border-lighter;
              cursor: pointer;
              transition: all 0.3s;

              &:hover {
                border-color: $primary-color;
                box-shadow: 0 2px 8px rgba($primary-color, 0.2);

                .voucher-overlay {
                  opacity: 1;
                }
              }

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .voucher-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                opacity: 0;
                transition: opacity 0.3s;

                .el-icon {
                  font-size: 32px;
                  margin-bottom: 8px;
                }

                span {
                  font-size: 14px;
                }
              }
            }
          }
        }
      }

      .order-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        background: #fafafa;
        border-top: 1px solid $border-lighter;
      }
    }
  }
}
</style>

