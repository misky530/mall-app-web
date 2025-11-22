<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Delete, Document, BankCard, Plus } from '@element-plus/icons-vue'
import { ORDER_STATUS, getOrderStatusName } from '@/utils/orderStatus'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = ref(route.params.id)

// 订单信息
const orderInfo = ref(null)

// 经办人收款账户信息（Mock数据）
const paymentAccount = ref({
  accountName: 'XX商贸有限公司',
  accountNumber: '6222 0210 1234 5678 901',
  bankName: '中国工商银行深圳分行',
  bankAddress: '深圳市南山区科技园支行',
  remark: '请务必在转账备注中填写订单号，以便我们及时确认您的付款'
})

// 上传的付款凭证
const paymentVouchers = ref([])

// 上传中
const uploading = ref(false)

// 提交中
const submitting = ref(false)

// 模拟获取订单详情
const fetchOrderDetail = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 从localStorage获取订单数据
    const savedOrder = localStorage.getItem(`order_${orderId.value}`)
    if (savedOrder) {
      orderInfo.value = JSON.parse(savedOrder)
    } else {
      // Mock数据
      orderInfo.value = {
        id: orderId.value,
        orderSn: `ORDER${orderId.value}`,
        status: ORDER_STATUS.CREATED,
        statusName: getOrderStatusName(ORDER_STATUS.CREATED),
        totalAmount: 1000.00,
        freightAmount: 10.00,
        payAmount: 1010.00,
        createTime: new Date().toLocaleString('zh-CN'),
        items: [
          {
            id: 1,
            productName: '示例商品',
            productPic: 'https://via.placeholder.com/80',
            price: 1000.00,
            quantity: 1
          }
        ]
      }
    }
  } catch (error) {
    console.error('获取订单详情失败：', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 获取经办人收款账户信息（Mock）
const fetchPaymentAccount = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    // 实际应该从API获取
    // const res = await getPaymentAccount()
    // paymentAccount.value = res.data
  } catch (error) {
    console.error('获取收款账户信息失败：', error)
  }
}

// 上传付款凭证
const handleUploadVoucher = (file) => {
  uploading.value = true

  // 模拟上传
  setTimeout(() => {
    const fileUrl = URL.createObjectURL(file.raw)
    paymentVouchers.value.push({
      uid: Date.now(),
      name: file.name,
      url: fileUrl,
      raw: file.raw
    })
    uploading.value = false
    ElMessage.success('上传成功')
  }, 1000)

  return false // 阻止自动上传
}

// 删除付款凭证
const handleRemoveVoucher = (file) => {
  const index = paymentVouchers.value.findIndex(item => item.uid === file.uid)
  if (index > -1) {
    paymentVouchers.value.splice(index, 1)
    ElMessage.success('删除成功')
  }
}

// 提交付款凭证
const handleSubmitPayment = async () => {
  if (paymentVouchers.value.length === 0) {
    ElMessage.warning('请上传付款凭证')
    return
  }

  ElMessageBox.confirm(
    '确认提交付款凭证？提交后请等待经办人确认收款。',
    '确认提交',
    {
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      submitting.value = true

      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 更新订单状态
        if (orderInfo.value) {
          orderInfo.value.status = ORDER_STATUS.PAID_PENDING_VERIFY
          orderInfo.value.statusName = getOrderStatusName(ORDER_STATUS.PAID_PENDING_VERIFY)
          orderInfo.value.paymentVouchers = paymentVouchers.value.map(v => v.url)
          orderInfo.value.payTime = new Date().toLocaleString('zh-CN')

          // 保存到localStorage
          localStorage.setItem(`order_${orderId.value}`, JSON.stringify(orderInfo.value))
        }

        ElMessage.success('付款凭证提交成功，请等待经办人确认')

        // 跳转到订单详情页
        router.push(`/order/detail/${orderId.value}`)
      } catch (error) {
        console.error('提交付款凭证失败：', error)
        ElMessage.error('提交失败，请重试')
      } finally {
        submitting.value = false
      }
    })
    .catch(() => {
      // 取消
    })
}

// 复制账户信息
const handleCopyAccount = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

onMounted(() => {
  fetchOrderDetail()
  fetchPaymentAccount()
})
</script>

<template>
  <div class="pay-page">
    <div class="container">
      <!-- 支付金额 -->
      <div class="amount-section">
        <div class="amount-label">应付金额</div>
        <div class="amount-price">¥{{ orderInfo?.payAmount?.toFixed(2) || '0.00' }}</div>
        <div class="amount-desc">订单号：{{ orderInfo?.orderSn }}</div>
      </div>

      <!-- 支付方式说明 -->
      <div class="payment-method-section">
        <div class="section-title">
          <el-icon><BankCard /></el-icon>
          <span>支付方式：线下对公转账/银行转账</span>
        </div>
        <div class="payment-notice">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>
              <div class="notice-content">
                <p>请通过银行转账方式完成付款，转账完成后请上传付款凭证（银行回执单截图或PDF）。</p>
                <p>经办人确认收款后，系统将自动通知卖家发货。</p>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 收款账户信息 -->
      <div class="account-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>经办人收款账户信息</span>
        </div>
        <div class="account-info">
          <div class="account-item">
            <div class="account-label">账户名称：</div>
            <div class="account-value">
              {{ paymentAccount.accountName }}
              <el-button
                text
                type="primary"
                size="small"
                @click="handleCopyAccount(paymentAccount.accountName)"
              >
                复制
              </el-button>
            </div>
          </div>
          <div class="account-item">
            <div class="account-label">银行账号：</div>
            <div class="account-value">
              {{ paymentAccount.accountNumber }}
              <el-button
                text
                type="primary"
                size="small"
                @click="handleCopyAccount(paymentAccount.accountNumber)"
              >
                复制
              </el-button>
            </div>
          </div>
          <div class="account-item">
            <div class="account-label">开户银行：</div>
            <div class="account-value">{{ paymentAccount.bankName }}</div>
          </div>
          <div class="account-item">
            <div class="account-label">开户行地址：</div>
            <div class="account-value">{{ paymentAccount.bankAddress }}</div>
          </div>
          <div v-if="paymentAccount.remark" class="account-remark">
            <el-alert
              type="warning"
              :closable="false"
              show-icon
            >
              {{ paymentAccount.remark }}
            </el-alert>
          </div>
        </div>
      </div>

      <!-- 上传付款凭证 -->
      <div class="voucher-section">
        <div class="section-title">
          <el-icon><Upload /></el-icon>
          <span>上传付款凭证</span>
        </div>
        <div class="voucher-upload">
          <el-upload
            :file-list="paymentVouchers"
            :on-preview="() => {}"
            :on-remove="handleRemoveVoucher"
            :before-upload="handleUploadVoucher"
            :limit="5"
            accept="image/*,.pdf"
            list-type="picture-card"
            :disabled="uploading"
          >
            <el-icon v-if="!uploading" class="upload-icon"><Plus /></el-icon>
            <div v-else class="uploading-text">上传中...</div>
          </el-upload>
          <div class="upload-tips">
            <p>支持上传图片（JPG、PNG）或PDF文件，最多5个文件</p>
            <p>请上传清晰的银行转账回执单截图或PDF文件</p>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <el-button
          type="primary"
          size="large"
          :loading="submitting"
          :disabled="paymentVouchers.length === 0"
          @click="handleSubmitPayment"
        >
          {{ submitting ? '提交中...' : '我已付款，提交凭证' }}
        </el-button>
        <div class="submit-tips">
          <p>提交凭证后，请耐心等待经办人确认收款（通常1-2个工作日）</p>
        </div>
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

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

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

  .payment-method-section,
  .account-section,
  .voucher-section {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid $border-lighter;
    }

    .payment-notice {
      .notice-content {
        p {
          margin: 4px 0;
          line-height: 1.6;
        }
      }
    }

    .account-info {
      .account-item {
        display: flex;
        align-items: center;
        padding: 16px;
        margin-bottom: 12px;
        background: #f8f9fa;
        border-radius: $border-radius-small;

        .account-label {
          min-width: 120px;
          font-weight: 500;
          color: $text-primary;
        }

        .account-value {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          color: $text-regular;
          font-size: 15px;
        }
      }

      .account-remark {
        margin-top: 16px;
      }
    }

    .voucher-upload {
      .upload-icon {
        font-size: 28px;
        color: $text-secondary;
      }

      .uploading-text {
        font-size: 14px;
        color: $text-secondary;
      }

      .upload-tips {
        margin-top: 16px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: $border-radius-small;
        font-size: 13px;
        color: $text-secondary;
        line-height: 1.8;

        p {
          margin: 4px 0;
        }
      }
    }
  }

  .submit-section {
    text-align: center;
    margin-top: 40px;

    .el-button {
      width: 400px;
      height: 50px;
      font-size: 18px;
    }

    .submit-tips {
      margin-top: 16px;
      font-size: 13px;
      color: $text-secondary;

      p {
        margin: 4px 0;
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .account-item {
    flex-direction: column;
    align-items: flex-start !important;

    .account-value {
      margin-top: 8px;
    }
  }

  .submit-section .el-button {
    width: 100% !important;
  }
}
</style>
