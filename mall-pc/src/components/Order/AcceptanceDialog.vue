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
    title="货物验收"
    width="600px"
    @close="handleClose"
  >
    <div class="acceptance-dialog">
      <el-form label-position="top">
        <el-form-item label="验收结果">
          <el-radio-group v-model="acceptanceResult">
            <el-radio value="pass">
              <el-icon><Check /></el-icon>
              验收通过
            </el-radio>
            <el-radio value="fail">
              <el-icon><Close /></el-icon>
              验收失败
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="acceptanceResult === 'fail'" label="失败原因">
          <el-input
            v-model="failReason"
            type="textarea"
            :rows="4"
            placeholder="请详细描述验收失败的原因，如商品破损、规格不符、数量不对等"
          />
        </el-form-item>

        <el-form-item v-if="acceptanceResult === 'fail'" label="上传证据（必填）">
          <el-upload
            :file-list="evidenceList"
            :on-change="handleUploadChange"
            :on-remove="handleRemove"
            :auto-upload="false"
            accept="image/*"
            list-type="picture-card"
            :limit="5"
          >
            <el-icon><Upload /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传5张图片，每张不超过5MB</div>
        </el-form-item>

        <div v-if="acceptanceResult === 'pass'" class="notice-box">
          <p><strong>确认验收通过后：</strong></p>
          <ul>
            <li>订单将进入待结算状态</li>
            <li>经办人确认后将向卖家结算款项</li>
            <li>请确认商品无误后再点击确认</li>
          </ul>
        </div>

        <div v-else class="notice-box warning">
          <p><strong>提交验收失败后：</strong></p>
          <ul>
            <li>订单将进入仲裁流程</li>
            <li>经办人将根据您提供的证据进行仲裁</li>
            <li>请确保证据真实有效</li>
          </ul>
        </div>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '确认提交' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.acceptance-dialog {
  .el-radio-group {
    display: flex;
    gap: 20px;

    .el-radio {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      border: 2px solid $border-light;
      border-radius: $border-radius-base;
      margin: 0;

      &.is-checked {
        border-color: $primary-color;
        background: rgba($primary-color, 0.05);
      }

      .el-icon {
        margin-right: 8px;
      }
    }
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: $text-placeholder;
  }

  .notice-box {
    background: #e6f7ff;
    border-left: 4px solid #1890ff;
    padding: 16px 20px;
    border-radius: 4px;
    margin-top: 20px;

    &.warning {
      background: #fff7e6;
      border-left-color: #faad14;

      p {
        color: #d46b08;
      }
    }

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
      }
    }
  }
}
</style>
