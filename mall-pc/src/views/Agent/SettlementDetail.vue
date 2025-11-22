<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 订单ID
const orderId = ref(route.params.id)

// 订单详情
const orderDetail = ref(null)

// 卖家收款账户信息（Mock数据）
const sellerAccount = ref({
  accountName: '某某供应商有限公司',
  bankName: '中国建设银行深圳分行',
  accountNumber: '6227 0012 3456 7890',
  swiftCode: 'PCBCCNBJSZN'
})

// 结算凭证
const settlementVoucher = ref(null)
const voucherFileList = ref([])

// 提交中
const submitting = ref(false)

// 获取订单详情
const fetchOrderDetail = () => {
  try {
    const savedOrder = localStorage.getItem(`order_${orderId.value}`)
    if (savedOrder) {
      orderDetail.value = JSON.parse(savedOrder)
    } else {
      ElMessage.error('订单不存在')
      router.back()
    }
  } catch (error) {
    console.error('获取订单详情失败：', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 处理文件上传
const handleUploadChange = (uploadFile) => {
  if (uploadFile.raw) {
    const isImage = uploadFile.raw.type.startsWith('image/')
    const isPDF = uploadFile.raw.type === 'application/pdf'

    if (!isImage && !isPDF) {
      ElMessage.error('只能上传图片或PDF文件')
      return false
    }

    const isLt5M = uploadFile.raw.size / 1024 / 1024 < 5
    if (!isLt5M) {
      ElMessage.error('文件大小不能超过 5MB')
      return false
    }

    settlementVoucher.value = URL.createObjectURL(uploadFile.raw)
    voucherFileList.value = [uploadFile]
    ElMessage.success('凭证上传成功')
  }
}

// 移除文件
const handleRemove = () => {
  settlementVoucher.value = null
  voucherFileList.value = []
}

// 确认结算
const handleConfirmSettlement = async () => {
  if (!settlementVoucher.value) {
    ElMessage.warning('请先上传结算凭证')
    return
  }

  submitting.value = true

  try {
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 更新订单状态为"已完成" (Settled)
    const updatedOrder = {
      ...orderDetail.value,
      status: 4,
      statusName: '已完成',
      settlementTime: new Date().toLocaleString('zh-CN'),
      settlementVoucher: settlementVoucher.value
    }

    localStorage.setItem(`order_${orderId.value}`, JSON.stringify(updatedOrder))

    ElMessage.success('结算成功，订单已完成')

    // 返回列表页
    router.push('/agent/settlement')
  } catch (error) {
    console.error('结算失败：', error)
    ElMessage.error('结算失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="settlement-detail-page">
    <div class="container">
      <div v-if="orderDetail">
        <!-- 页面标题 -->
        <div class="page-header">
          <h2>执行结算</h2>
          <el-button @click="router.back()">返回列表</el-button>
        </div>

        <!-- 订单信息 -->
        <div class="order-info-section">
          <h3>订单信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>订单号：</label>
              <span>{{ orderDetail.orderSn }}</span>
            </div>
            <div class="info-item">
              <label>订单状态：</label>
              <el-tag type="success">{{ orderDetail.statusName }}</el-tag>
            </div>
            <div class="info-item">
              <label>结算金额：</label>
              <span class="amount">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <label>验收时间：</label>
              <span>{{ orderDetail.acceptanceTime || orderDetail.verifyTime }}</span>
            </div>
          </div>
        </div>

        <!-- 卖家收款账户 -->
        <div class="account-info-section">
          <h3>
            <el-icon style="margin-right: 8px;"><Document /></el-icon>
            卖家收款账户
          </h3>
          <div class="account-content">
            <div class="info-item">
              <label>收款户名：</label>
              <span class="value">{{ sellerAccount.accountName }}</span>
            </div>
            <div class="info-item">
              <label>开户银行：</label>
              <span class="value">{{ sellerAccount.bankName }}</span>
            </div>
            <div class="info-item">
              <label>银行账号：</label>
              <span class="value highlight">{{ sellerAccount.accountNumber }}</span>
              <el-button
                link
                type="primary"
                size="small"
                @click="() => {
                  navigator.clipboard.writeText(sellerAccount.accountNumber.replace(/\s/g, ''))
                  ElMessage.success('账号已复制')
                }"
              >
                复制
              </el-button>
            </div>
            <div class="info-item">
              <label>SWIFT代码：</label>
              <span class="value">{{ sellerAccount.swiftCode }}</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>结算说明：</strong></p>
            <ul>
              <li>请向卖家指定账户转账结算款项</li>
              <li>转账备注请填写订单号：<strong>{{ orderDetail.orderSn }}</strong></li>
              <li>转账完成后，请上传银行转账回执单</li>
            </ul>
          </div>
        </div>

        <!-- 上传结算凭证 -->
        <div class="voucher-section">
          <h3>
            <el-icon style="margin-right: 8px;"><Upload /></el-icon>
            上传结算凭证
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

        <!-- 操作按钮 -->
        <div class="action-section">
          <el-button
            size="large"
            @click="router.back()"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="!settlementVoucher"
            @click="handleConfirmSettlement"
          >
            {{ submitting ? '提交中...' : '确认已结算' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.settlement-detail-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
  padding: 40px 0;

  .page-header {
    background: white;
    padding: 20px 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      font-size: 24px;
      font-weight: bold;
      color: $text-primary;
      margin: 0;
    }
  }

  .order-info-section,
  .account-info-section,
  .voucher-section {
    background: white;
    padding: 30px;
    margin-bottom: 20px;
    border-radius: $border-radius-base;

    h3 {
      font-size: 18px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid $border-light;
      display: flex;
      align-items: center;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .info-item {
        display: flex;
        align-items: center;

        label {
          min-width: 120px;
          font-size: 14px;
          color: $text-secondary;
        }

        span {
          font-size: 14px;
          color: $text-primary;

          &.amount {
            color: $primary-color;
            font-weight: 500;
            font-size: 20px;
          }
        }
      }
    }
  }

  .account-info-section {
    .account-content {
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
      background: #e6f7ff;
      border-left: 4px solid #1890ff;
      padding: 16px 20px;
      border-radius: 4px;

      p {
        margin: 0 0 8px 0;
        color: #0050b3;
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

  .action-section {
    background: white;
    padding: 30px;
    border-radius: $border-radius-base;
    display: flex;
    justify-content: center;
    gap: 20px;

    .el-button {
      min-width: 200px;
      height: 50px;
      font-size: 16px;
    }
  }
}
</style>
