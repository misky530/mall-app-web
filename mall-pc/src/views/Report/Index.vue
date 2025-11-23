<script setup>
import { ref, onMounted } from 'vue'
import { Refresh, Loading } from '@element-plus/icons-vue'
import CapitalOverview from './components/CapitalOverview.vue'
import AlertRadar from './components/AlertRadar.vue'
import TodoList from './components/TodoList.vue'

// 当前日期
const currentDate = ref(new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}))

// 刷新数据
const refreshing = ref(false)
const handleRefresh = async () => {
  refreshing.value = true
  // 触发子组件刷新
  window.location.reload()
}

onMounted(() => {
  console.log('报表页面已加载')
})
</script>

<template>
  <div class="report-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h1>资金池监控看板</h1>
          <p class="subtitle">B2B托管交易实时数据分析</p>
        </div>
        <div class="header-right">
          <div class="date-info">
            <span class="date-label">数据日期</span>
            <span class="date-value">{{ currentDate }}</span>
          </div>
          <el-button
            :icon="Refresh"
            :loading="refreshing"
            @click="handleRefresh"
          >
            刷新数据
          </el-button>
        </div>
      </div>

      <!-- P0-1: 资金状态总览卡片 -->
      <CapitalOverview />

      <!-- P0 核心看板 -->
      <div class="core-dashboard">
        <div class="dashboard-left">
          <!-- P0-2: 异常预警雷达 -->
          <AlertRadar />
        </div>
        <div class="dashboard-right">
          <!-- P0-3: 今日工作清单 -->
          <TodoList />
        </div>
      </div>

      <!-- P1 功能区域（占位，后续实现） -->
      <div class="p1-placeholder">
        <el-empty description="更多报表功能开发中...">
          <template #image>
            <div style="font-size: 64px;">📊</div>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.report-page {
  min-height: calc(100vh - 200px);
  background: #f0f2f5;
  padding: 20px 0 40px;

  .page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 32px 40px;
    margin-bottom: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;

    .header-left {
      h1 {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 8px 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .subtitle {
        font-size: 16px;
        margin: 0;
        opacity: 0.95;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;

      .date-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        backdrop-filter: blur(10px);

        .date-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .date-value {
          font-size: 18px;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
      }

      .el-button {
        background: white;
        color: #667eea;
        border: none;
        height: 44px;
        padding: 0 24px;
        font-weight: 500;

        &:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  .core-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;

    .dashboard-left,
    .dashboard-right {
      min-height: 500px;
    }
  }

  .p1-placeholder {
    background: white;
    border-radius: 12px;
    padding: 60px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}
</style>
