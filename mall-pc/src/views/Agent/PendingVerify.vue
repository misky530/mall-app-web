<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Search } from '@element-plus/icons-vue'

const router = useRouter()

// 待确认收款订单列表
const orderList = ref([])
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 获取待确认收款订单列表
const fetchPendingOrders = () => {
  loading.value = true
  try {
    // 从localStorage中读取所有订单，筛选出状态为"待确认收款"的订单
    const orders = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('order_')) {
        const orderData = localStorage.getItem(key)
        if (orderData) {
          const order = JSON.parse(orderData)
          // status: 0 表示"待确认收款" (Paid_Pending_Verify)
          if (order.status === 0) {
            orders.push(order)
          }
        }
      }
    }

    // 按提交时间降序排序
    orderList.value = orders.sort((a, b) => {
      const timeA = new Date(a.submitVoucherTime || a.createTime).getTime()
      const timeB = new Date(b.submitVoucherTime || b.createTime).getTime()
      return timeB - timeA
    })
  } catch (error) {
    console.error('获取订单列表失败：', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索过滤后的订单列表
const filteredOrderList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return orderList.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return orderList.value.filter(order => {
    return order.orderSn.toLowerCase().includes(keyword) ||
           order.receiverName.toLowerCase().includes(keyword)
  })
})

// 查看订单详情（进入确认页面）
const viewOrderDetail = (order) => {
  router.push(`/agent/verify/${order.id}`)
}

onMounted(() => {
  fetchPendingOrders()
})
</script>

<template>
  <div class="pending-verify-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>待确认收款订单</h2>
        <p class="subtitle">买家已提交付款凭证，等待财务确认</p>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号或收货人"
          :prefix-icon="Search"
          clearable
          style="max-width: 400px;"
        />
        <div class="stats">
          <span class="stat-item">
            待处理：<strong>{{ filteredOrderList.length }}</strong> 单
          </span>
        </div>
      </div>

      <!-- 订单列表 -->
      <div v-loading="loading" class="order-list">
        <div v-if="filteredOrderList.length > 0" class="order-cards">
          <div
            v-for="order in filteredOrderList"
            :key="order.id"
            class="order-card"
          >
            <div class="order-header">
              <div class="order-info">
                <span class="order-sn">订单号：{{ order.orderSn }}</span>
                <el-tag type="warning" size="small">{{ order.statusName }}</el-tag>
              </div>
              <div class="order-time">
                提交时间：{{ order.submitVoucherTime || order.createTime }}
              </div>
            </div>

            <div class="order-body">
              <div class="order-items">
                <div
                  v-for="(item, index) in order.items.slice(0, 3)"
                  :key="index"
                  class="item-preview"
                >
                  <img :src="item.productPic || item.pic" :alt="item.productName || item.name" />
                </div>
                <div v-if="order.items.length > 3" class="item-more">
                  +{{ order.items.length - 3 }}
                </div>
              </div>

              <div class="order-details">
                <div class="detail-item">
                  <span class="label">收货人：</span>
                  <span class="value">{{ order.receiverName }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">支付金额：</span>
                  <span class="value amount">¥{{ order.payAmount?.toFixed(2) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">支付方式：</span>
                  <span class="value">{{ order.payTypeName }}</span>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <el-button
                type="primary"
                :icon="View"
                @click="viewOrderDetail(order)"
              >
                查看凭证并确认
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-else-if="!loading" description="暂无待确认的订单" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.pending-verify-page {
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

  .search-bar {
    background: white;
    padding: 20px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .stats {
      display: flex;
      gap: 30px;

      .stat-item {
        font-size: 14px;
        color: $text-secondary;

        strong {
          color: $primary-color;
          font-size: 18px;
          margin: 0 4px;
        }
      }
    }
  }

  .order-list {
    min-height: 400px;

    .order-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .order-card {
        background: white;
        border-radius: $border-radius-base;
        overflow: hidden;
        transition: all 0.3s;
        border: 1px solid $border-light;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .order-header {
          padding: 16px 24px;
          background: #fafafa;
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

          .order-time {
            font-size: 12px;
            color: $text-placeholder;
          }
        }

        .order-body {
          padding: 20px 24px;
          display: flex;
          gap: 30px;

          .order-items {
            display: flex;
            gap: 8px;
            align-items: center;

            .item-preview {
              width: 60px;
              height: 60px;
              border-radius: 4px;
              overflow: hidden;
              border: 1px solid $border-light;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }

            .item-more {
              width: 60px;
              height: 60px;
              border-radius: 4px;
              background: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              color: $text-secondary;
            }
          }

          .order-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;

            .detail-item {
              display: flex;
              align-items: center;

              .label {
                width: 80px;
                font-size: 14px;
                color: $text-secondary;
              }

              .value {
                font-size: 14px;
                color: $text-primary;

                &.amount {
                  color: $primary-color;
                  font-weight: 500;
                  font-size: 16px;
                }
              }
            }
          }
        }

        .order-footer {
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
