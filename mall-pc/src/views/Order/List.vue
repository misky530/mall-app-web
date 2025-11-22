<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'

const router = useRouter()

// 订单状态标签
const orderStatusTabs = [
  { label: '全部订单', value: '' },
  { label: '待付款', value: 0 },
  { label: '待确认', value: 1 },
  { label: '待发货', value: 2 },
  { label: '待收货', value: 3 },
  { label: '维权中', value: 5 },
  { label: '已完成', value: 6 }
]

// 当前激活的标签
const activeTab = ref('')
// 订单列表
const orderList = ref([])
// 加载状态
const loading = ref(false)
// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取订单列表
const fetchOrderList = async () => {
  loading.value = true
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 从localStorage获取所有订单
    const orders = loadOrdersFromLocalStorage()

    // 根据状态筛选
    let filteredOrders = orders
    if (activeTab.value !== '') {
      if (activeTab.value === 6) { // 已完成 tab 包括 待结算和已结算
        filteredOrders = orders.filter(order => order.status >= 6)
      } else {
        filteredOrders = orders.filter(order => order.status === activeTab.value)
      }
    }

    // 按创建时间倒序排列（最新的在前）
    filteredOrders.sort((a, b) => {
      const timeA = new Date(a.createTime).getTime()
      const timeB = new Date(b.createTime).getTime()
      return timeB - timeA
    })

    orderList.value = filteredOrders
    total.value = filteredOrders.length
  } catch (error) {
    console.error('获取订单列表失败：', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 从localStorage加载所有订单
const loadOrdersFromLocalStorage = () => {
  const orders = []

  // 遍历localStorage，找到所有以order_开头的键
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('order_')) {
      try {
        const orderData = localStorage.getItem(key)
        if (orderData) {
          const order = JSON.parse(orderData)
          orders.push(order)
        }
      } catch (error) {
        console.error(`解析订单数据失败: ${key}`, error)
      }
    }
  }

  // 如果没有订单，返回一些示例订单供演示
  if (orders.length === 0) {
    return generateMockOrders()
  }

  return orders
}

// 生成 Mock 订单数据（用于演示，当没有真实订单时）
const generateMockOrders = () => {
  const statusList = [0, 1, 2, 3, 4]
  const statusNames = ['待付款', '待发货', '待收货', '待评价', '已完成']

  return Array.from({ length: 3 }, (_, index) => {
    const status = statusList[index % statusList.length]
    const orderId = `${Date.now()}${index}`
    const createTime = new Date(Date.now() - index * 86400000).toLocaleString('zh-CN')

    return {
      id: orderId,
      orderSn: `DEMO${orderId}`,
      status,
      statusName: statusNames[status],
      createTime,
      totalAmount: 299.00 + index * 100,
      payAmount: 299.00 + index * 100,
      items: [
        {
          id: index * 10 + 1,
          productId: index + 1,
          productName: `演示商品 ${index + 1}`,
          productPic: `https://images.unsplash.com/photo-${1500000000000 + index * 100000}?w=300&h=300&fit=crop`,
          price: 299.00,
          quantity: 1,
          productSku: '颜色:黑色'
        }
      ]
    }
  })
}

// 切换标签
const handleTabChange = (tabValue) => {
  activeTab.value = tabValue
  currentPage.value = 1
  fetchOrderList()
}

// 查看订单详情
const goToDetail = (orderId) => {
  router.push(`/order/detail/${orderId}`)
}

// 取消订单
const handleCancelOrder = (order) => {
  ElMessage.info('取消订单功能待开发')
}

// 再次购买
const handleBuyAgain = (order) => {
  ElMessage.info('再次购买功能待开发')
}

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.style.display = 'none'
  if (e.target.parentElement) {
    e.target.parentElement.style.background = '#f0f0f0'
    e.target.parentElement.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">
        <div style="text-align: center;">
          <div style="font-size: 32px; margin-bottom: 4px;">📦</div>
          <div>暂无图片</div>
        </div>
      </div>
    `
  }
}

// 获取订单操作按钮
const getOrderActions = (order) => {
  const actions = []

  switch (order.status) {
    case 0: // 待付款
      actions.push({ label: '上传凭证', type: 'primary', handler: () => goToDetail(order.id) })
      actions.push({ label: '取消订单', type: 'info', handler: handleCancelOrder })
      break
    case 1: // 待确认收款
    case 2: // 待发货
      actions.push({ label: '查看详情', type: 'primary', handler: () => goToDetail(order.id) })
      break
    case 3: // 待收货
      actions.push({ label: '去验收', type: 'primary', handler: () => router.push(`/order/acceptance/${order.id}`) })
      actions.push({ label: '查看物流', type: 'info', handler: () => goToDetail(order.id) })
      break
    case 5: // 维权中
      actions.push({ label: '查看详情', type: 'danger', handler: () => goToDetail(order.id) })
      break
    case 6: // 待结算
    case 7: // 已结算
      actions.push({ label: '再次购买', type: 'primary', handler: handleBuyAgain })
      break
  }

  return actions
}

onMounted(() => {
  fetchOrderList()
})
</script>

<template>
  <div class="order-list-page">
    <div class="container">
      <!-- 面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/user/profile' }">用户中心</el-breadcrumb-item>
        <el-breadcrumb-item>我的订单</el-breadcrumb-item>
      </el-breadcrumb>

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
            <el-empty description="暂无订单">
              <el-button type="primary" @click="router.push('/')">
                去逛逛
              </el-button>
            </el-empty>
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
                  <el-tag :type="order.status === 0 ? 'danger' : 'success'">
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
                  @click="goToDetail(order.id)"
                >
                  <div class="product-image">
                    <img
                      :src="item.productPic"
                      :alt="item.productName"
                      @error="handleImageError"
                    />
                  </div>
                  <div class="product-info">
                    <div class="product-name">{{ item.productName }}</div>
                    <div class="product-sku" v-if="item.productSku">{{ item.productSku }}</div>
                  </div>
                  <div class="product-price">¥{{ item.price.toFixed(2) }}</div>
                  <div class="product-quantity">x{{ item.quantity }}</div>
                </div>
              </div>

              <!-- 订单底部 -->
              <div class="order-footer">
                <div class="order-amount">
                  <span class="label">实付款：</span>
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

        <!-- 分页 -->
        <div v-if="total > pageSize" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            layout="prev, pager, next, jumper"
            @current-change="fetchOrderList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.order-list-page {
  padding: 20px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);

  .breadcrumb {
    margin-bottom: 20px;
  }

  .order-content {
    // 订单标签
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

    // 订单列表
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

        // 订单头部
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

          .order-status {
            font-size: 14px;
          }
        }

        // 商品列表
        .order-products {
          .product-item {
            display: grid;
            grid-template-columns: 80px 1fr 120px 80px;
            gap: 16px;
            padding: 16px 20px;
            border-bottom: 1px solid $border-lighter;
            cursor: pointer;
            transition: background 0.3s;

            &:hover {
              background: #fafafa;
            }

            &:last-child {
              border-bottom: none;
            }

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
                margin-bottom: 4px;
              }

              .product-sku {
                font-size: 12px;
                color: $text-placeholder;
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

        // 订单底部
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

    // 分页
    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .order-tabs {
    flex-wrap: wrap;
    gap: 8px !important;

    .tab-item {
      padding: 6px 12px !important;
      font-size: 13px !important;
    }
  }

  .product-item {
    grid-template-columns: 60px 1fr !important;

    .product-price,
    .product-quantity {
      grid-column: 2;
      justify-content: flex-start !important;
      font-size: 13px !important;
    }
  }

  .order-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;

    .order-actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }
}
</style>
