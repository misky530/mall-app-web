<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Money, Search } from '@element-plus/icons-vue'

const router = useRouter()

// 待结算订单列表
const settlementList = ref([])
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 统计信息
const stats = ref({
  totalCount: 0,
  totalAmount: 0
})

// 获取待结算订单列表
const fetchSettlementOrders = () => {
  loading.value = true
  try {
    const orders = []
    let totalAmount = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('order_')) {
        const orderData = localStorage.getItem(key)
        if (orderData) {
          const order = JSON.parse(orderData)
          // status: 3 表示"待结算" (Accepted_Pending_Settlement)
          if (order.status === 3) {
            orders.push(order)
            totalAmount += order.payAmount || 0
          }
        }
      }
    }

    settlementList.value = orders.sort((a, b) => {
      const timeA = new Date(a.acceptanceTime || a.verifyTime).getTime()
      const timeB = new Date(b.acceptanceTime || b.verifyTime).getTime()
      return timeB - timeA
    })

    stats.value = {
      totalCount: orders.length,
      totalAmount: totalAmount
    }
  } catch (error) {
    console.error('获取待结算列表失败：', error)
    ElMessage.error('获取待结算列表失败')
  } finally {
    loading.value = false
  }
}

// 前往结算页面
const goToSettle = (order) => {
  router.push(`/agent/settlement/${order.id}`)
}

onMounted(() => {
  fetchSettlementOrders()
})
</script>

<template>
  <div class="settlement-list-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>待结算订单</h2>
        <p class="subtitle">买家验收通过，等待向卖家结算款项</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff;">
            <el-icon :size="32" color="#1890ff"><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待结算订单数</div>
            <div class="stat-value">{{ stats.totalCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6;">
            <el-icon :size="32" color="#fa8c16"><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待结算总金额</div>
            <div class="stat-value amount">¥{{ stats.totalAmount.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号"
          :prefix-icon="Search"
          clearable
          style="max-width: 400px;"
        />
      </div>

      <!-- 订单列表 -->
      <div v-loading="loading" class="order-list">
        <div v-if="settlementList.length > 0" class="order-table">
          <el-table :data="settlementList" stripe>
            <el-table-column prop="orderSn" label="订单号" width="180" />
            <el-table-column label="订单状态" width="120">
              <template #default="{ row }">
                <el-tag type="success">{{ row.statusName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="receiverName" label="收货人" width="100" />
            <el-table-column label="结算金额" width="150">
              <template #default="{ row }">
                <span class="amount">¥{{ row.payAmount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="验收时间" width="180">
              <template #default="{ row }">
                {{ row.acceptanceTime || row.verifyTime || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="支付方式" width="120">
              <template #default="{ row }">
                {{ row.payTypeName }}
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="goToSettle(row)"
                >
                  执行结算
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else-if="!loading" description="暂无待结算的订单" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.settlement-list-page {
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

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: $border-radius-base;
      display: flex;
      align-items: center;
      gap: 20px;

      .stat-icon {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-content {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: $text-primary;

          &.amount {
            color: $primary-color;
          }
        }
      }
    }
  }

  .search-bar {
    background: white;
    padding: 20px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;
  }

  .order-list {
    min-height: 400px;

    .order-table {
      background: white;
      padding: 20px;
      border-radius: $border-radius-base;

      .amount {
        color: $primary-color;
        font-weight: 500;
        font-size: 16px;
      }
    }
  }
}
</style>
