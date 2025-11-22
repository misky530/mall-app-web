<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// 订单ID
const orderId = ref(route.params.id)

// 订单信息（从本地缓存获取，因为没有真实API）
const orderInfo = ref(null)

// 支付方式：1-支付宝，2-微信
const payType = ref(1)

// 支付中
const paying = ref(false)

// 模拟获取订单详情
const fetchOrderDetail = () => {
  // 由于使用本地存储，这里构造订单信息
  const selectedItems = cartStore.selectedItems
  const totalAmount = cartStore.selectedTotal + (cartStore.selectedTotal >= 99 ? 0 : 10)

  orderInfo.value = {
    orderId: orderId.value,
    orderSn: `ORDER${orderId.value}`,
    totalAmount: totalAmount,
    payAmount: totalAmount,
    receiverName: '张三',
    items: selectedItems
  }
}

// 选择支付方式
const selectPayType = (type) => {
  payType.value = type
}

// 确认支付
const handlePay = async () => {
  paying.value = true

  try {
    // 模拟支付过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 在线API需要认证，这里模拟支付成功
    // 真实场景应该调用 payOrderSuccess API 或跳转到支付宝

    ElMessage.success('支付成功')

    // 清空购物车中已下单的商品
    if (orderInfo.value && orderInfo.value.items) {
      const itemIds = orderInfo.value.items.map(item => item.id)
      await cartStore.removeCartItems({ cartIds: itemIds })
    }

    // 跳转到支付成功页面
    router.replace({
      path: '/order/pay/success',
      query: { orderId: orderId.value }
    })
  } catch (error) {
    console.error('支付失败：', error)
    ElMessage.error('支付失败，请重试')
  } finally {
    paying.value = false
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="pay-page">
    <div class="container">
      <!-- 支付金额 -->
      <div class="amount-section">
        <div class="amount-label">支付金额</div>
        <div class="amount-price">¥{{ orderInfo?.payAmount?.toFixed(2) || '0.00' }}</div>
        <div class="amount-desc">订单号：{{ orderInfo?.orderSn }}</div>
      </div>

      <!-- 支付方式选择 -->
      <div class="pay-type-section">
        <h3>选择支付方式</h3>
        <div class="pay-type-list">
          <div
            :class="['pay-type-item', { active: payType === 1 }]"
            @click="selectPayType(1)"
          >
            <div class="pay-type-icon alipay">
              <svg viewBox="0 0 1024 1024" width="40" height="40">
                <path d="M1023.795 701.127c-0.151-3.945-0.755-7.74-1.057-11.685-17.057-181.533-144.44-348.973-317.101-417.959-8.948-3.643-18.718-5.757-28.186-8.044-73.325-17.51-148.536-21.003-223.445-18.265-7.891 0.302-15.782 0.604-23.673 1.208-82.726 5.757-164.167 21.154-241.265 52.107-26.676 10.761-53.049 22.06-78.177 35.729-42.24 22.663-81.065 50.597-115.607 83.362-55.918 53.049-100.122 115.154-128.51 185.175-5.303 13.065-10.157 26.373-14.406 39.681-11.081 34.371-17.661 70.402-19.473 106.735-0.604 11.232-0.453 22.663 0 33.895 1.057 24.428 4.096 48.704 9.55 72.517 13.065 56.674 37.794 109.724 71.91 156.731 79.536 109.422 206.316 178.387 341.772 191.3 15.178 1.51 30.507 2.114 45.835 2.718 63.161 2.416 126.473-2.869 188.126-16.537 43.448-9.55 85.99-23.069 126.171-41.485 35.427-16.235 69.544-35.427 101.481-58.788 1.057-0.755 1.963-1.51 3.02-2.265 66.634-49.006 123.61-108.516 167.962-176.273 1.963-3.02 4.096-6.19 6.039-9.21 30.96-48.402 55.918-100.424 73.626-155.221 11.836-36.937 20.178-75.159 24.88-113.833 0.906-7.287 1.661-14.708 2.265-22.06 1.359-18.567 1.661-37.34 1.208-56.071zM736.752 448.663c8.646 5.001 17.359 9.852 25.635 15.329 58.939 38.851 105.795 91.298 136.604 153.251-68.336 26.072-140.042 43.297-213.065 51.639-17.661 2.114-35.578 3.02-53.352 4.549-76.493 6.512-153.1 6.663-229.744 3.945-55.616-2.114-110.931-7.287-165.793-16.084-30.507-4.851-60.863-10.459-90.917-17.208-12.612-2.869-25.333-5.606-37.945-8.797-9.097-2.416-13.971-9.4-12.461-18.416 5.757-35.125 13.367-69.695 24.73-103.413 17.208-51.036 42.693-98.461 76.493-140.646 48.855-60.712 110.78-108.214 182.788-139.921 46.74-20.631 95.746-34.069 146.329-40.429 29.299-3.643 58.637-4.7 88.087-3.795 42.089 1.359 83.664 7.891 124.51 19.624 29.148 8.344 57.429 19.171 84.254 33.14 55.314 28.639 103.564 67.162 143.088 114.285 25.786 30.96 47.344 64.973 64.099 101.179 8.646 18.869 15.933 38.247 21.909 58.033 5.001 16.537-1.208 26.071-17.51 28.789-28.79 4.851-57.731 8.495-86.823 10.91-60.409 5.001-120.818 5.001-181.382 0.302-3.945-0.302-6.814 1.359-9.4 4.247-18.869 20.48-37.794 40.881-56.976 61.013-1.057 1.208-2.869 2.114-4.4 2.114-46.287 0.453-92.506 0.906-138.794 1.359h-5.001c6.512-10.006 12.763-19.322 18.718-28.79 29.148-46.74 58.335-93.412 87.275-140.193 2.567-4.247 5.303-6.361 10.459-6.663 69.846-3.945 139.469-9.4 208.581-20.33 17.057-2.718 34.22-5.303 51.338-7.74z" fill="#009FE8"></path>
              </svg>
            </div>
            <div class="pay-type-info">
              <div class="pay-type-name">支付宝支付</div>
              <div class="pay-type-desc">推荐使用支付宝支付</div>
            </div>
            <div class="pay-type-radio">
              <el-radio :model-value="payType" :label="1" />
            </div>
          </div>

          <div
            :class="['pay-type-item', { active: payType === 2 }]"
            @click="selectPayType(2)"
          >
            <div class="pay-type-icon wechat">
              <svg viewBox="0 0 1024 1024" width="40" height="40">
                <path d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 46.165436 152.460344 123.281791 205.78483l-30.80868 91.730191 107.688651-53.455469c38.556583 7.53665 69.365263 15.308661 107.688651 15.308661 9.66308 0 19.230982-0.470721 28.752858-1.225921-6.025227-20.36584-9.521864-41.723264-9.521864-63.862493C402.024533 476.632491 517.908058 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.556583 15.120372 38.556583 38.062431 0 22.942059-15.356186 38.556583-38.556583 38.556583-23.081834 0-46.306623-15.614524-46.306623-38.556583C452.322347 300.994262 475.547136 285.87389 498.62897 285.87389zM283.016307 362.492995c-23.081834 0-46.167809-15.614524-46.167809-38.556583 0-22.942059 23.085975-38.062431 46.167809-38.062431 23.105811 0 38.461997 15.120372 38.461997 38.062431C321.478304 346.878471 306.122118 362.492995 283.016307 362.492995zM945.448458 606.151333c0-121.888048-123.21983-221.236753-261.683163-221.236753-146.57838 0-262.509831 99.348706-262.509831 221.236753 0 122.06508 115.93145 221.200938 262.509831 221.200938 30.66644 0 61.617066-7.609305 92.423746-15.262635l84.513836 45.786813-23.034858-76.091943C899.379213 735.776599 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.332163 0-30.807673-15.096348-30.807673-30.501524 0-15.190998 15.47551-30.477501 30.807673-30.477501 23.034858 0 38.415024 15.286503 38.415024 30.477501C637.218507 552.897944 621.838341 567.994292 598.803483 567.994292zM768.25071 567.994292c-15.213997 0-30.594164-15.096348-30.594164-30.501524 0-15.190998 15.380167-30.477501 30.594164-30.477501 23.081834 0 38.461997 15.286503 38.461997 30.477501C806.712707 552.897944 791.332544 567.994292 768.25071 567.994292z" fill="#00C800"></path>
              </svg>
            </div>
            <div class="pay-type-info">
              <div class="pay-type-name">微信支付</div>
              <div class="pay-type-desc">使用微信扫码支付</div>
            </div>
            <div class="pay-type-radio">
              <el-radio :model-value="payType" :label="2" />
            </div>
          </div>
        </div>
      </div>

      <!-- 支付按钮 -->
      <div class="pay-button-section">
        <el-button
          type="primary"
          size="large"
          :loading="paying"
          @click="handlePay"
        >
          {{ paying ? '支付中...' : '确认支付' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.pay-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
  padding: 40px 0;

  .amount-section {
    background: white;
    padding: 60px 0;
    text-align: center;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    .amount-label {
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 16px;
    }

    .amount-price {
      font-size: 48px;
      font-weight: bold;
      color: $primary-color;
      margin-bottom: 12px;

      &::before {
        content: '¥';
        font-size: 32px;
        margin-right: 4px;
      }
    }

    .amount-desc {
      font-size: 12px;
      color: $text-placeholder;
    }
  }

  .pay-type-section {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h3 {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 24px;
      color: $text-primary;
    }

    .pay-type-list {
      .pay-type-item {
        display: flex;
        align-items: center;
        padding: 20px;
        border: 2px solid $border-light;
        border-radius: $border-radius-base;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          border-color: $primary-color;
          background: rgba($primary-color, 0.02);
        }

        &.active {
          border-color: $primary-color;
          background: rgba($primary-color, 0.05);
        }

        .pay-type-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          margin-right: 20px;

          &.alipay {
            background: #e6f7ff;
          }

          &.wechat {
            background: #f0f9ff;
          }
        }

        .pay-type-info {
          flex: 1;

          .pay-type-name {
            font-size: 16px;
            font-weight: 500;
            color: $text-primary;
            margin-bottom: 4px;
          }

          .pay-type-desc {
            font-size: 12px;
            color: $text-secondary;
          }
        }

        .pay-type-radio {
          margin-left: 20px;
        }
      }
    }
  }

  .pay-button-section {
    text-align: center;
    margin-top: 40px;

    .el-button {
      width: 400px;
      height: 50px;
      font-size: 18px;
    }
  }
}
</style>
