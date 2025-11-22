<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, Scale, Money } from '@element-plus/icons-vue'

const router = useRouter()

// 导航菜单
const menuItems = ref([
  {
    path: '/agent/pending-verify',
    icon: Wallet,
    label: '待确认收款',
    badge: 0
  },
  {
    path: '/agent/arbitration',
    icon: Scale,
    label: '验收仲裁',
    badge: 0
  },
  {
    path: '/agent/settlement',
    icon: Money,
    label: '待结算订单',
    badge: 0
  }
])

// 统计各状态订单数量
const loadBadges = () => {
  let pendingVerify = 0
  let arbitration = 0
  let settlement = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('order_')) {
      const orderData = localStorage.getItem(key)
      if (orderData) {
        try {
          const order = JSON.parse(orderData)
          if (order.status === 0) pendingVerify++
          if (order.status === -2) arbitration++
          if (order.status === 3) settlement++
        } catch (e) {
          console.error('Parse order error:', e)
        }
      }
    }
  }

  menuItems.value[0].badge = pendingVerify
  menuItems.value[1].badge = arbitration
  menuItems.value[2].badge = settlement
}

const handleMenuClick = (path) => {
  router.push(path)
}

onMounted(() => {
  loadBadges()
})
</script>

<template>
  <div class="agent-index-page">
    <div class="container">
      <div class="page-header">
        <h2>经办人工作台</h2>
        <p class="subtitle">管理B2B担保交易流程</p>
      </div>

      <div class="menu-grid">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="menu-card"
          @click="handleMenuClick(item.path)"
        >
          <div class="menu-icon">
            <el-icon :size="48" color="#1890ff">
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
        <h3>经办人职责</h3>
        <ul>
          <li><strong>待确认收款：</strong>核对买家上传的付款凭证，确认收款后通知卖家发货</li>
          <li><strong>验收仲裁：</strong>处理买家验收失败的订单，根据证据进行仲裁判决</li>
          <li><strong>待结算订单：</strong>向卖家结算货款，上传结算凭证完成交易</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.agent-index-page {
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
    grid-template-columns: repeat(3, 1fr);
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
        border-color: $primary-color;
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

  .info-section {
    background: white;
    padding: 30px;
    border-radius: $border-radius-base;

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
}
</style>
