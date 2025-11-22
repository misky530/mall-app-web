<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ORDER_STATUS, getOrderStatusName, getOrderStatusTagType } from '@/utils/orderStatus'

const router = useRouter()

// 订单状态标签
const orderStatusTabs = [
  { label: '全部订单', value: '' },
  { label: '待发货', value: ORDER_STATUS.PROCESSING },
  { label: '已发货', value: ORDER_STATUS.SHIPPED },
  { label: '待结算', value: ORDER_STATUS.COMPLETED },
  { label: '已结算', value: ORDER_STATUS.SETTLED }
]

// 当前激活的标签
const activeTab = ref(ORDER_STATUS.PROCESSING)
// 订单列表
const orderList = ref([])
// 加载状态
const loading = ref(false)

// 获取订单列表（Mock）
const fetchOrderList = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock数据
    const mockOrders = [
      {
        id: '1',
        orderSn: 'ORD20240120001',
        status: ORDER_STATUS.PROCESSING,
        statusName: getOrderStatusName(ORDER_STATUS.PROCESSING),
        createTime: '2024-01-20 14:30:25',
        payTime: '2024-01-20 14:32:10',
        totalAmount: 1000.00,
        payAmount: 1010.00,
        buyerName: 'XX公司',
        buyerPhone: '13800138000',
        receiverName: '张三',
        receiverAddress: '广东省深圳市南山区科技园XX路XX号',
        items: [
          {
            id: 1,
            productName: '示例商品A',
            productPic: 'https://via.placeholder.com/80',
            price: 1000.00,
            quantity: 1
          }
        ]
      },
      {
        id: '2',
        orderSn: 'ORD20240119001',
        status: ORDER_STATUS.SHIPPED,
        statusName: getOrderStatusName(ORDER_STATUS.SHIPPED),
        createTime: '2024-01-19 10:20:15',
        payTime: '2024-01-19 10:25:30',
        deliveryTime: '2024-01-19 15:30:00',
        totalAmount: 2000.00,
        payAmount: 2010.00,
        buyerName: 'YY公司',
        deliveryCompany: '顺丰速运',
        deliverySn: 'SF1234567890',
        items: [
          {
            id: 2,
            productName: '示例商品B',
            productPic: 'https://via.placeholder.com/80',
            price: 2000.00,
            quantity: 1
          }
        ]
      }
    ]

    // 根据状态筛选
    let filteredOrders = mockOrders
    if (activeTab.value !== '') {
      filteredOrders = mockOrders.filter(order => order.status === activeTab.value)
    }

    orderList.value = filteredOrders
  } catch (error) {
    console.error('获取订单列表失败：', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 切换标签
const handleTabChange = (tabValue) => {
  activeTab.value = tabValue
  fetchOrderList()
}

// 去发货
const handleShip = (order) => {
  router.push(`/seller/order/ship/${order.id}`)
}

// 查看详情
const handleViewDetail = (order) => {
  router.push(`/seller/order/detail/${order.id}`)
}

// 获取订单操作按钮
const getOrderActions = (order) => {
  const actions = []

  switch (order.status) {
    case ORDER_STATUS.PROCESSING: // 待发货
      actions.push({ label: '去发货', type: 'primary', handler: handleShip })
      actions.push({ label: '查看详情', type: 'info', handler: handleViewDetail })
      break
    case ORDER_STATUS.SHIPPED: // 已发货
      actions.push({ label: '查看详情', type: 'primary', handler: handleViewDetail })
      break
    case ORDER_STATUS.COMPLETED: // 待结算
      actions.push({ label: '查看详情', type: 'primary', handler: handleViewDetail })
      break
    case ORDER_STATUS.SETTLED: // 已结算
      actions.push({ label: '查看详情', type: 'primary', handler: handleViewDetail })
      break
  }

  return actions
}

onMounted(() => {
  fetchOrderList()
})
</script>

<template>
  <div class="seller-order-list-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>订单管理</h2>
        <p class="page-desc">管理您的订单，处理发货和查看财务信息</p>
      </div>

      <div class="order-content">
        <!-- 订单状态标签 -->
        <div class="order-tabs">
          <div
            v-for="tab in orderStatusTabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: activeTab === tab.value }"
            @click="handleTabChange(tab.value)"
          >
            {{ tab.label }}
          </div>
        </div>

        <!-- 订单列表 -->
        <div v-loading="loading" class="order-list">
          <div v-if="orderList.length === 0" class="empty-orders">
            <el-empty description="暂无订单" />
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
                  <span class="order-time">{{ order.createTime }}</span>
                </div>
                <div class="order-status">
                  <el-tag :type="getOrderStatusTagType(order.status)">
                    {{ order.statusName }}
                  </el-tag>
                </div>
              </div>

              <!-- 订单商品列表 -->
              <div class="order-products">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="product-item"
                >
                  <div class="product-image">
                    <img :src="item.productPic" :alt="item.productName" />
                  </div>
                  <div class="product-info">
                    <div class="product-name">{{ item.productName }}</div>
                  </div>
                  <div class="product-price">¥{{ item.price.toFixed(2) }}</div>
                  <div class="product-quantity">x{{ item.quantity }}</div>
                </div>
              </div>

              <!-- 订单信息 -->
              <div class="order-details">
                <div class="detail-row" v-if="order.buyerName">
                  <span class="label">买家：</span>
                  <span class="value">{{ order.buyerName }}</span>
                </div>
                <div class="detail-row" v-if="order.receiverName">
                  <span class="label">收货人：</span>
                  <span class="value">{{ order.receiverName }} {{ order.receiverAddress }}</span>
                </div>
                <div class="detail-row" v-if="order.deliveryCompany">
                  <span class="label">物流：</span>
                  <span class="value">{{ order.deliveryCompany }} {{ order.deliverySn }}</span>
                </div>
              </div>

              <!-- 订单底部 -->
              <div class="order-footer">
                <div class="order-amount">
                  <span class="label">订单金额：</span>
                  <span class="amount">¥{{ order.payAmount.toFixed(2) }}</span>
                </div>
                <div class="order-actions">
                  <el-button
                    v-for="(action, index) in getOrderActions(order)"
                    :key="index"
                    :type="action.type"
                    size="small"
                    @click="action.handler(order)"
                  >
                    {{ action.label }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.seller-order-list-page {
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

  .order-content {
    .order-tabs {
      display: flex;
      gap: 12px;
      background: white;
      padding: 16px 20px;
      border-radius: $border-radius-base;
      margin-bottom: 16px;

      .tab-item {
        padding: 8px 20px;
        cursor: pointer;
        border-radius: $border-radius-small;
        font-size: 14px;
        color: $text-secondary;
        transition: all 0.3s;

        &:hover {
          color: $primary-color;
          background: #f0f7ff;
        }

        &.active {
          color: white;
          background: $primary-color;
        }
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

        .order-products {
          .product-item {
            display: grid;
            grid-template-columns: 80px 1fr 120px 80px;
            gap: 16px;
            padding: 16px 20px;
            border-bottom: 1px solid $border-lighter;

            .product-image {
              width: 80px;
              height: 80px;
              border-radius: $border-radius-small;
              overflow: hidden;
              border: 1px solid $border-lighter;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }

            .product-info {
              display: flex;
              flex-direction: column;
              justify-content: center;

              .product-name {
                font-size: 14px;
                color: $text-primary;
                line-height: 1.5;
              }
            }

            .product-price {
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: $text-primary;
            }

            .product-quantity {
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              color: $text-secondary;
            }
          }
        }

        .order-details {
          padding: 12px 20px;
          background: #fafafa;
          border-bottom: 1px solid $border-lighter;

          .detail-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 13px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              color: $text-secondary;
              min-width: 80px;
            }

            .value {
              color: $text-primary;
              flex: 1;
            }
          }
        }

        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #fafafa;

          .order-amount {
            font-size: 14px;

            .label {
              color: $text-secondary;
            }

            .amount {
              font-size: 18px;
              font-weight: bold;
              color: $primary-color;
              margin-left: 8px;
            }
          }

          .order-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }
}
</style>

