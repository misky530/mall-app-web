<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Ship } from '@element-plus/icons-vue'
import { enrichOrder } from '@/utils/productApi'

const router = useRouter()

// 订单列表
const orderList = ref([])
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 当前激活的标签页
const activeTab = ref('pending-ship')

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const orders = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('order_')) {
        const orderData = localStorage.getItem(key)
        if (orderData) {
          try {
            const order = JSON.parse(orderData)
            // 只显示B2B担保交易订单 (payType === 3)
            if (order.payType === 3) {
              orders.push(order)
            }
          } catch (e) {
            console.error('Failed to parse order:', key, e)
          }
        }
      }
    }

    // 为所有订单获取完整商品信息
    const enrichedOrders = await Promise.all(
      orders.map(order => enrichOrder(order))
    )

    // 按创建时间降序排序
    orderList.value = enrichedOrders.sort((a, b) => {
      const timeA = new Date(a.createTime).getTime()
      const timeB = new Date(b.createTime).getTime()
      return timeB - timeA
    })
  } catch (error) {
    console.error('获取订单列表失败：', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 根据标签页筛选订单
const filteredOrders = computed(() => {
  let orders = orderList.value

  // 根据标签页筛选
  if (activeTab.value === 'pending-ship') {
    orders = orders.filter(order => order.status === 1)
  } else if (activeTab.value === 'shipped') {
    orders = orders.filter(order => order.status === 2)
  } else if (activeTab.value === 'pending-settlement') {
    orders = orders.filter(order => order.status === 3)
  } else if (activeTab.value === 'settled') {
    orders = orders.filter(order => order.status === 4)
  }

  // 根据搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    orders = orders.filter(order => {
      return order.orderSn.toLowerCase().includes(keyword) ||
             order.receiverName.toLowerCase().includes(keyword)
    })
  }

  return orders
})

// 统计各状态订单数量
const statusCounts = computed(() => {
  const counts = {
    pendingShip: 0,
    shipped: 0,
    pendingSettlement: 0,
    settled: 0
  }

  orderList.value.forEach(order => {
    if (order.status === 1) counts.pendingShip++
    if (order.status === 2) counts.shipped++
    if (order.status === 3) counts.pendingSettlement++
    if (order.status === 4) counts.settled++
  })

  return counts
})

// 查看订单详情
const viewOrderDetail = (order) => {
  router.push(`/seller/order/${order.id}`)
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="seller-order-list-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>卖家订单管理</h2>
        <p class="subtitle">管理B2B担保交易订单</p>
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
      </div>

      <!-- 标签页 -->
      <div class="tabs-section">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="待发货" name="pending-ship">
            <template #label>
              <span class="tab-label">
                待发货
                <el-badge
                  v-if="statusCounts.pendingShip > 0"
                  :value="statusCounts.pendingShip"
                  class="badge"
                />
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="已发货" name="shipped">
            <template #label>
              <span class="tab-label">
                已发货
                <el-badge
                  v-if="statusCounts.shipped > 0"
                  :value="statusCounts.shipped"
                  class="badge"
                />
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="待结算" name="pending-settlement">
            <template #label>
              <span class="tab-label">
                待结算
                <el-badge
                  v-if="statusCounts.pendingSettlement > 0"
                  :value="statusCounts.pendingSettlement"
                  class="badge"
                />
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="已完成" name="settled">
            <template #label>
              <span class="tab-label">
                已完成
                <el-badge
                  v-if="statusCounts.settled > 0"
                  :value="statusCounts.settled"
                  class="badge"
                />
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 订单列表 -->
      <div v-loading="loading" class="order-list">
        <div v-if="filteredOrders.length > 0" class="order-cards">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="order-card"
          >
            <div class="order-header">
              <div class="order-info">
                <span class="order-sn">订单号：{{ order.orderSn }}</span>
                <el-tag
                  :type="order.status === 1 ? 'warning' : order.status === 2 ? 'primary' : order.status === 3 ? 'success' : 'info'"
                  size="small"
                >
                  {{ order.statusName }}
                </el-tag>
              </div>
              <div class="order-time">
                创建时间：{{ order.createTime }}
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
                  <span class="label">订单金额：</span>
                  <span class="value amount">¥{{ order.payAmount?.toFixed(2) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">支付方式：</span>
                  <span class="value">{{ order.payTypeName }}</span>
                </div>
                <div v-if="order.verifyTime" class="detail-item">
                  <span class="label">确认收款：</span>
                  <span class="value">{{ order.verifyTime }}</span>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <el-button
                type="primary"
                @click="viewOrderDetail(order)"
              >
                查看详情
              </el-button>
              <el-button
                v-if="order.status === 1"
                type="success"
                :icon="Ship"
                @click="viewOrderDetail(order)"
              >
                发货
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-else-if="!loading" description="暂无订单" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.seller-order-list-page {
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
  }

  .tabs-section {
    background: white;
    padding: 0 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;

      .badge {
        margin-left: 4px;
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
                width: 100px;
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
