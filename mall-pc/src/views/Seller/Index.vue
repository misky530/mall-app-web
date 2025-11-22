<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Ship, Document, Money, Finished } from '@element-plus/icons-vue'

const router = useRouter()

// 导航菜单
const menuItems = ref([
  {
    path: '/seller/orders?tab=pending-ship',
    icon: Ship,
    label: '待发货订单',
    badge: 0
  },
  {
    path: '/seller/orders?tab=shipped',
    icon: Document,
    label: '已发货订单',
    badge: 0
  },
  {
    path: '/seller/orders?tab=pending-settlement',
    icon: Money,
    label: '待结算订单',
    badge: 0
  },
  {
    path: '/seller/orders?tab=settled',
    icon: Finished,
    label: '已完成订单',
    badge: 0
  }
])

// 统计各状态订单数量
const loadBadges = () => {
  let pendingShip = 0
  let shipped = 0
  let pendingSettlement = 0
  let settled = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('order_')) {
      const orderData = localStorage.getItem(key)
      if (orderData) {
        try {
          const order = JSON.parse(orderData)
          // 只统计B2B担保交易订单 (payType === 3)
          if (order.payType === 3) {
            if (order.status === 1) pendingShip++
            if (order.status === 2) shipped++
            if (order.status === 3) pendingSettlement++
            if (order.status === 4) settled++
          }
        } catch (e) {
          console.error('Parse order error:', e)
        }
      }
    }
  }

  menuItems.value[0].badge = pendingShip
  menuItems.value[1].badge = shipped
  menuItems.value[2].badge = pendingSettlement
  menuItems.value[3].badge = settled
}

const handleMenuClick = (path) => {
  router.push(path)
}

onMounted(() => {
  loadBadges()
})
</script>

<template>
  <div class="seller-index-page">
    <div class="container">
      <div class="page-header">
        <h2>卖家工作台</h2>
        <p class="subtitle">管理B2B担保交易订单流程</p>
      </div>

      <div class="menu-grid">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="menu-card"
          @click="handleMenuClick(item.path)"
        >
          <div class="menu-icon">
            <el-icon :size="48" color="#52c41a">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="menu-label">{{ item.label }}</div>
          <div v-if="item.badge > 0" class="menu-badge">
            {{ item.badge }}
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>卖家职责</h3>
        <ul>
          <li><strong>待发货订单：</strong>经办人确认买家付款后，卖家需要及时发货，填写物流信息</li>
          <li><strong>已发货订单：</strong>查看已发货订单的物流状态，等待买家验收</li>
          <li><strong>待结算订单：</strong>买家验收通过后，等待经办人结算货款</li>
          <li><strong>已完成订单：</strong>经办人已结算货款，交易完成</li>
        </ul>
      </div>

      <div class="notice-section">
        <h3>温馨提示</h3>
        <ul>
          <li>收到发货通知后，请在24小时内发货，否则订单可能被取消</li>
          <li>发货时请务必填写正确的物流公司和物流单号</li>
          <li>如遇买家验收失败，请配合经办人提供相关证据</li>
          <li>结算款项将在买家验收通过后由经办人打款到您的账户</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.seller-index-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
  padding: 40px 0;

  .page-header {
    background: white;
    padding: 30px;
    margin-bottom: 30px;
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

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 30px;

    .menu-card {
      background: white;
      padding: 40px 30px;
      border-radius: $border-radius-base;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #52c41a;
      }

      .menu-icon {
        margin-bottom: 20px;
      }

      .menu-label {
        font-size: 18px;
        font-weight: 500;
        color: $text-primary;
      }

      .menu-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        background: #ff4d4f;
        color: white;
        border-radius: 12px;
        padding: 4px 12px;
        font-size: 14px;
        font-weight: bold;
      }
    }
  }

  .info-section,
  .notice-section {
    background: white;
    padding: 30px;
    border-radius: $border-radius-base;
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 20px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 12px 0;
        font-size: 14px;
        color: $text-secondary;
        line-height: 1.8;
        border-bottom: 1px dashed $border-light;

        &:last-child {
          border-bottom: none;
        }

        strong {
          color: $text-primary;
        }
      }
    }
  }

  .notice-section {
    background: #fffbe6;
    border-left: 4px solid #faad14;

    h3 {
      color: #d48806;
    }

    ul li {
      border-bottom-color: #ffe58f;
    }
  }
}
</style>
