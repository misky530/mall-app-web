<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Check, Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

// 验收结果：pass-通过，fail-失败
const acceptanceResult = ref('pass')

// 验收证据（图片）
const evidenceList = ref([])

// 失败原因
const failReason = ref('')

// 提交中
const submitting = ref(false)

// 处理文件上传
const handleUploadChange = (file, fileList) => {
  if (file.raw) {
    const isImage = file.raw.type.startsWith('image/')
    if (!isImage) {
      ElMessage.error('只能上传图片文件')
      fileList.pop()
      return false
    }

    const isLt5M = file.raw.size / 1024 / 1024 < 5
    if (!isLt5M) {
      ElMessage.error('图片大小不能超过 5MB')
      fileList.pop()
      return false
    }

    // Mock：生成虚拟URL
    file.url = URL.createObjectURL(file.raw)
  }
  evidenceList.value = fileList
}

// 移除文件
const handleRemove = (file, fileList) => {
  evidenceList.value = fileList
}

// 提交验收
const handleSubmit = async () => {
  if (acceptanceResult.value === 'fail' && !failReason.value.trim()) {
    ElMessage.warning('请填写验收失败原因')
    return
  }

  if (acceptanceResult.value === 'fail' && evidenceList.value.length === 0) {
    ElMessage.warning('请上传验收失败的证据图片')
    return
  }

  submitting.value = true

  try {
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 读取原订单数据
    const savedOrder = localStorage.getItem(`order_${props.orderId}`)
    if (savedOrder) {
      const orderData = JSON.parse(savedOrder)

      if (acceptanceResult.value === 'pass') {
        // 验收通过 - 状态更新为"待结算" (Accepted_Pending_Settlement)
        orderData.status = 3
        orderData.statusName = '待结算'
        orderData.acceptanceStatus = 'passed'
        orderData.acceptanceTime = new Date().toLocaleString('zh-CN')
        ElMessage.success('验收通过，订单进入待结算状态')
      } else {
        // 验收失败 - 状态更新为"验收失败" (Acceptance_Failed)
        orderData.status = -2
        orderData.statusName = '验收失败'
        orderData.acceptanceStatus = 'failed'
        orderData.acceptanceTime = new Date().toLocaleString('zh-CN')
        orderData.failReason = failReason.value
        orderData.evidenceImages = evidenceList.value.map(file => file.url)
        ElMessage.warning('验收失败，已提交仲裁申请')
      }

      localStorage.setItem(`order_${props.orderId}`, JSON.stringify(orderData))

      emit('success')
      handleClose()
    }
  } catch (error) {
    console.error('提交失败：', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  acceptanceResult.value = 'pass'
  evidenceList.value = []
  failReason.value = ''
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="650px"
    @close="handleClose"
    :show-close="true"
    class="acceptance-dialog-wrapper"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <el-icon :size="24" color="#52c41a"><Check /></el-icon>
        </div>
        <div class="header-text">
          <h3>货物验收</h3>
          <p>请仔细检查商品后进行验收</p>
        </div>
      </div>
    </template>

    <div class="acceptance-dialog">
      <el-form label-position="top">
        <!-- 验收结果选择 -->
        <el-form-item label="验收结果" class="result-item">
          <div class="result-options">
            <div
              class="result-card"
              :class="{ active: acceptanceResult === 'pass' }"
              @click="acceptanceResult = 'pass'"
            >
              <div class="card-icon success">
                <el-icon :size="32"><Check /></el-icon>
              </div>
              <div class="card-title">验收通过</div>
              <div class="card-desc">商品符合要求，质量合格</div>
            </div>
            <div
              class="result-card"
              :class="{ active: acceptanceResult === 'fail' }"
              @click="acceptanceResult = 'fail'"
            >
              <div class="card-icon danger">
                <el-icon :size="32"><Close /></el-icon>
              </div>
              <div class="card-title">验收失败</div>
              <div class="card-desc">商品存在问题，需要仲裁</div>
            </div>
          </div>
        </el-form-item>

        <!-- 验收失败时显示的表单 -->
        <transition name="fade">
          <div v-if="acceptanceResult === 'fail'" class="fail-section">
            <el-form-item label="失败原因" required>
              <el-input
                v-model="failReason"
                type="textarea"
                :rows="4"
                placeholder="请详细描述验收失败的原因，如：&#10;1. 商品破损或包装损坏&#10;2. 规格型号与订单不符&#10;3. 数量缺少或质量问题&#10;4. 其他问题..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="上传证据图片" required>
              <div class="upload-section">
                <el-upload
                  :file-list="evidenceList"
                  :on-change="handleUploadChange"
                  :on-remove="handleRemove"
                  :auto-upload="false"
                  accept="image/*"
                  list-type="picture-card"
                  :limit="5"
                >
                  <div class="upload-trigger">
                    <el-icon :size="24"><Upload /></el-icon>
                    <div class="upload-text">点击上传</div>
                  </div>
                </el-upload>
                <div class="upload-tip">
                  <el-icon><Upload /></el-icon>
                  支持JPG、PNG格式，最多上传5张，每张不超过5MB
                </div>
              </div>
            </el-form-item>
          </div>
        </transition>

        <!-- 提示信息 -->
        <div v-if="acceptanceResult === 'pass'" class="notice-box success-notice">
          <div class="notice-header">
            <el-icon><Check /></el-icon>
            <span>验收通过说明</span>
          </div>
          <ul>
            <li>订单将自动进入<strong>待结算</strong>状态</li>
            <li>经办人审核后会将款项结算给卖家</li>
            <li>请确认商品完好无损再进行操作</li>
          </ul>
        </div>

        <div v-else class="notice-box warning-notice">
          <div class="notice-header">
            <el-icon><Close /></el-icon>
            <span>验收失败说明</span>
          </div>
          <ul>
            <li>订单将进入<strong>仲裁流程</strong></li>
            <li>经办人会根据您提供的证据进行仲裁</li>
            <li>请务必上传真实有效的证据图片</li>
            <li>仲裁结果将影响后续的退款或换货</li>
          </ul>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="handleClose">取消</el-button>
        <el-button
          :type="acceptanceResult === 'pass' ? 'success' : 'warning'"
          size="large"
          :loading="submitting"
          @click="handleSubmit"
        >
          <el-icon v-if="!submitting">
            <Check v-if="acceptanceResult === 'pass'" />
            <Close v-else />
          </el-icon>
          {{ submitting ? '提交中...' : (acceptanceResult === 'pass' ? '确认验收通过' : '提交仲裁申请') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.acceptance-dialog-wrapper {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 30px;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 30px;
    border-top: 1px solid $border-lighter;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 30px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-bottom: 1px solid $border-lighter;

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(82, 196, 26, 0.15);
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: $text-secondary;
      }
    }
  }
}

.acceptance-dialog {
  .result-item {
    :deep(.el-form-item__label) {
      font-weight: 500;
      font-size: 15px;
      color: $text-primary;
      margin-bottom: 16px;
    }
  }

  .result-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .result-card {
      padding: 24px;
      border: 2px solid $border-light;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      background: #fafafa;

      &:hover {
        border-color: #d9d9d9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.active {
        border-color: #52c41a;
        background: #f6ffed;
        box-shadow: 0 4px 12px rgba(82, 196, 26, 0.15);

        .card-icon.success {
          background: #52c41a;
          color: white;
        }

        &:has(.card-icon.danger) {
          border-color: #faad14;
          background: #fffbe6;
          box-shadow: 0 4px 12px rgba(250, 173, 20, 0.15);

          .card-icon.danger {
            background: #faad14;
            color: white;
          }
        }
      }

      .card-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        transition: all 0.3s;

        &.success {
          background: #d9f7be;
          color: #52c41a;
        }

        &.danger {
          background: #ffe7ba;
          color: #faad14;
        }
      }

      .card-title {
        font-size: 16px;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 8px;
      }

      .card-desc {
        font-size: 13px;
        color: $text-secondary;
      }
    }
  }

  .fail-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px dashed $border-light;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: $text-primary;

      &::after {
        content: '*';
        color: #ff4d4f;
        margin-left: 4px;
      }
    }

    .upload-section {
      .upload-trigger {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .upload-text {
          font-size: 13px;
          color: $text-secondary;
        }
      }

      .upload-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
        color: $text-placeholder;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }

  .notice-box {
    margin-top: 24px;
    padding: 16px 20px;
    border-radius: 8px;
    border: 1px solid;

    &.success-notice {
      background: #f6ffed;
      border-color: #b7eb8f;

      .notice-header {
        color: #52c41a;
      }
    }

    &.warning-notice {
      background: #fffbe6;
      border-color: #ffe58f;

      .notice-header {
        color: #faad14;
      }
    }

    .notice-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;

      .el-icon {
        font-size: 16px;
      }
    }

    ul {
      margin: 0;
      padding-left: 24px;

      li {
        color: $text-secondary;
        font-size: 13px;
        line-height: 2;

        strong {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 120px;
    height: 40px;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
