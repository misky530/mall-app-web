<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SuccessFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const orderId = ref(route.query.orderId)

// 查看订单
const goToOrderDetail = () => {
  if (orderId.value) {
    router.push(`/order/detail/${orderId.value}`)
  } else {
    router.push('/order/list')
  }
}

// 返回首页
const goToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="pay-success-page">
    <div class="container">
      <div class="success-content">
        <div class="success-icon">
          <el-icon :size="120" color="#67c23a">
            <SuccessFilled />
          </el-icon>
        </div>
        <h1 class="success-title">支付成功</h1>
        <p class="success-desc">您的订单已支付成功，我们将尽快为您发货</p>
        <div v-if="orderId" class="order-info">
          <span class="order-label">订单号：</span>
          <span class="order-number">{{ orderId }}</span>
        </div>

        <div class="button-group">
          <el-button type="primary" size="large" @click="goToOrderDetail">
            查看订单
          </el-button>
          <el-button size="large" @click="goToHome">
            返回首页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.pay-success-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
  padding: 60px 0;

  .success-content {
    background: white;
    padding: 80px 60px;
    border-radius: $border-radius-base;
    text-align: center;

    .success-icon {
      margin-bottom: 32px;
    }

    .success-title {
      font-size: 32px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 16px;
    }

    .success-desc {
      font-size: 16px;
      color: $text-secondary;
      margin-bottom: 32px;
    }

    .order-info {
      padding: 20px;
      background: #f8f9fa;
      border-radius: $border-radius-base;
      margin-bottom: 40px;
      font-size: 14px;

      .order-label {
        color: $text-secondary;
        margin-right: 8px;
      }

      .order-number {
        color: $text-primary;
        font-weight: 500;
        font-family: monospace;
      }
    }

    .button-group {
      display: flex;
      gap: 20px;
      justify-content: center;

      .el-button {
        width: 200px;
        height: 48px;
        font-size: 16px;
      }
    }
  }
}
</style>
