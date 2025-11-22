<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElUpload } from 'element-plus'
import { Upload, Document } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import { enrichOrderItems } from '@/utils/productApi'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// 订单ID
const orderId = ref(route.params.id)

// 订单信息
const orderInfo = ref(null)

// 收款账户信息（Mock数据）
const bankAccount = ref({
  accountName: '某某科技有限公司',
  bankName: '中国工商银行深圳科技园支行',
  accountNumber: '4000 0123 4567 8901',
  swiftCode: 'ICBKCNBJSZN'
})

// 付款凭证
const paymentVoucher = ref(null)
const voucherFileList = ref([])

// 上传中
const uploading = ref(false)

// 模拟获取订单详情
const fetchOrderDetail = () => {
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

// 处理文件上传
const handleUploadChange = (uploadFile) => {
  if (uploadFile.raw) {
    // 验证文件类型
    const isImage = uploadFile.raw.type.startsWith('image/')
    const isPDF = uploadFile.raw.type === 'application/pdf'

    if (!isImage && !isPDF) {
      ElMessage.error('只能上传图片或PDF文件')
      return false
    }

    // 验证文件大小（不超过5MB）
    const isLt5M = uploadFile.raw.size / 1024 / 1024 < 5
    if (!isLt5M) {
      ElMessage.error('文件大小不能超过 5MB')
      return false
    }

    // Mock：模拟上传成功，生成一个虚拟URL
    paymentVoucher.value = URL.createObjectURL(uploadFile.raw)
    voucherFileList.value = [uploadFile]
    ElMessage.success('凭证上传成功')
  }
}

// 移除文件
const handleRemove = () => {
  paymentVoucher.value = null
  voucherFileList.value = []
}

// 提交付款凭证
const handleSubmitVoucher = async () => {
  if (!paymentVoucher.value) {
    ElMessage.warning('请先上传付款凭证')
    return
  }

  uploading.value = true

  try {
    // 从API获取完整的商品信息
    const enrichedItems = await enrichOrderItems(orderInfo.value.items)

    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 保存订单信息到localStorage
    const orderData = {
      id: orderId.value,
      orderSn: orderInfo.value.orderSn,
      status: 0, // 0: 待确认收款 (Paid_Pending_Verify)
      statusName: '待确认收款',
      createTime: new Date(parseInt(orderId.value)).toLocaleString('zh-CN'),
      submitVoucherTime: new Date().toLocaleString('zh-CN'),
      totalAmount: orderInfo.value.totalAmount - (orderInfo.value.totalAmount >= 99 ? 0 : 10),
      freightAmount: orderInfo.value.totalAmount >= 99 ? 0 : 10,
      payAmount: orderInfo.value.payAmount,
      payType: 3, // 3: 对公转账
      payTypeName: '对公转账',
      paymentVoucher: paymentVoucher.value, // 保存凭证URL
      receiverName: '张三',
      receiverPhone: '13800138000',
      receiverProvince: '广东省',
      receiverCity: '深圳市',
      receiverRegion: '南山区',
      receiverDetailAddress: '科技园南区XX路XX号',
      items: enrichedItems
    }

    // 存储订单数据
    localStorage.setItem(`order_${orderId.value}`, JSON.stringify(orderData))

    ElMessage.success('付款凭证已提交，等待财务确认')

    // 清空购物车中已下单的商品
    if (orderInfo.value && orderInfo.value.items) {
      const itemIds = orderInfo.value.items.map(item => item.id)
      await cartStore.removeCartItems({ cartIds: itemIds })
    }

    // 跳转到订单详情页
    router.replace({
      path: `/order/detail/${orderId.value}`
    })
  } catch (error) {
    console.error('提交失败：', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    uploading.value = false
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
        <div class="amount-label">订单金额</div>
        <div class="amount-price">{{ orderInfo?.payAmount?.toFixed(2) || '0.00' }}</div>
        <div class="amount-desc">订单号：{{ orderInfo?.orderSn }}</div>
      </div>

      <!-- 收款账户信息 -->
      <div class="bank-info-section">
        <h3>
          <el-icon style="margin-right: 8px;"><Document /></el-icon>
          收款账户信息
        </h3>
        <div class="bank-info-content">
          <div class="info-item">
            <label>收款户名：</label>
            <span class="value">{{ bankAccount.accountName }}</span>
          </div>
          <div class="info-item">
            <label>开户银行：</label>
            <span class="value">{{ bankAccount.bankName }}</span>
          </div>
          <div class="info-item">
            <label>银行账号：</label>
            <span class="value highlight">{{ bankAccount.accountNumber }}</span>
            <el-button
              link
              type="primary"
              size="small"
              @click="() => {
                navigator.clipboard.writeText(bankAccount.accountNumber.replace(/\s/g, ''))
                ElMessage.success('账号已复制')
              }"
            >
              复制
            </el-button>
          </div>
          <div class="info-item">
            <label>SWIFT代码：</label>
            <span class="value">{{ bankAccount.swiftCode }}</span>
          </div>
        </div>
        <div class="notice-box">
          <p><strong>温馨提示：</strong></p>
          <ul>
            <li>请使用对公账户转账，转账时请备注订单号：<strong>{{ orderInfo?.orderSn }}</strong></li>
            <li>转账完成后，请上传银行转账回执单（截图或PDF）</li>
            <li>财务人员确认到账后，系统将自动通知卖家发货</li>
          </ul>
        </div>
      </div>

      <!-- 上传付款凭证 -->
      <div class="voucher-section">
        <h3>
          <el-icon style="margin-right: 8px;"><Upload /></el-icon>
          上传付款凭证
        </h3>
        <div class="upload-area">
          <el-upload
            class="voucher-uploader"
            :file-list="voucherFileList"
            :auto-upload="false"
            :limit="1"
            :on-change="handleUploadChange"
            :on-remove="handleRemove"
            accept="image/*,application/pdf"
            list-type="picture-card"
          >
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">点击上传凭证</div>
            <template #tip>
              <div class="upload-tip">支持上传图片（JPG/PNG）或PDF文件，不超过5MB</div>
            </template>
          </el-upload>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-button-section">
        <el-button
          type="primary"
          size="large"
          :loading="uploading"
          :disabled="!paymentVoucher"
          @click="handleSubmitVoucher"
        >
          {{ uploading ? '提交中...' : '我已付款，提交凭证' }}
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px;
    text-align: center;
    margin-bottom: 20px;
    border-radius: $border-radius-base;
    color: white;

    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 12px;
    }

    .amount-price {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 12px;

      &::before {
        content: '¥';
        font-size: 32px;
        margin-right: 4px;
      }
    }

    .amount-desc {
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .bank-info-section {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h3 {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 24px;
      color: $text-primary;
      display: flex;
      align-items: center;
    }

    .bank-info-content {
      background: #f8f9fa;
      padding: 24px;
      border-radius: $border-radius-base;
      margin-bottom: 20px;

      .info-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px dashed $border-light;

        &:last-child {
          border-bottom: none;
        }

        label {
          width: 120px;
          font-size: 14px;
          color: $text-secondary;
        }

        .value {
          flex: 1;
          font-size: 15px;
          color: $text-primary;
          font-weight: 500;

          &.highlight {
            color: $primary-color;
            font-size: 18px;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          }
        }
      }
    }

    .notice-box {
      background: #fff7e6;
      border-left: 4px solid #faad14;
      padding: 16px 20px;
      border-radius: 4px;

      p {
        margin: 0 0 8px 0;
        color: #d46b08;
        font-size: 14px;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          color: $text-secondary;
          font-size: 13px;
          line-height: 1.8;

          strong {
            color: $primary-color;
          }
        }
      }
    }
  }

  .voucher-section {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h3 {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 24px;
      color: $text-primary;
      display: flex;
      align-items: center;
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;

      .voucher-uploader {
        :deep(.el-upload) {
          width: 200px;
          height: 200px;
          border: 2px dashed $border-base;
          border-radius: $border-radius-base;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;

          &:hover {
            border-color: $primary-color;
            background: rgba($primary-color, 0.05);
          }
        }

        :deep(.el-upload-list__item) {
          width: 200px;
          height: 200px;
        }

        .upload-icon {
          font-size: 48px;
          color: $text-placeholder;
          margin-bottom: 12px;
        }

        .upload-text {
          font-size: 14px;
          color: $text-secondary;
        }
      }

      .upload-tip {
        margin-top: 12px;
        font-size: 12px;
        color: $text-placeholder;
        text-align: center;
      }
    }
  }

  .submit-button-section {
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
