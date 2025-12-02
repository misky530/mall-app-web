<script setup>
import { ref, onMounted } from 'vue'
import { Refresh, Loading } from '@element-plus/icons-vue'
import { clearOrderCache } from '@/utils/reportData'
import CapitalOverview from './components/CapitalOverview.vue'
import AlertRadar from './components/AlertRadar.vue'
import TodoList from './components/TodoList.vue'
import CashflowTrend from './components/CashflowTrend.vue'
import RiskRanking from './components/RiskRanking.vue'
import EfficiencyGauge from './components/EfficiencyGauge.vue'

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
  console.log('刷新报表数据...')

  // 清除订单缓存,强制重新从API获取
  clearOrderCache()

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

      <!-- P1-1: 资金流入流出趋势图 -->
      <CashflowTrend />

      <!-- P1 双栏布局 -->
      <div class="p1-dashboard">
        <div class="dashboard-left">
          <!-- P1-2: 订单风险评分TOP 10 -->
          <RiskRanking />
        </div>
        <div class="dashboard-right">
          <!-- P1-3: 操作及时率仪表盘 -->
          <EfficiencyGauge />
        </div>
      </div>

      <!-- P2 功能区域（占位，后续实现） -->
      <div class="p2-placeholder">
        <div class="placeholder-content">
          <div class="icon">📈</div>
          <h3>更多高级分析功能</h3>
          <p>时段热力分布、效能成本分析、商业洞察看板等功能开发中...</p>
        </div>
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

  .p1-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;

    .dashboard-left,
    .dashboard-right {
      min-height: 400px;
    }
  }

  .p2-placeholder {
    background: linear-gradient(135deg, #f9fafb 0%, #f0f2f5 100%);
    border-radius: 12px;
    padding: 60px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    text-align: center;

    .placeholder-content {
      .icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        color: $text-primary;
        margin: 0 0 12px 0;
      }

      p {
        font-size: 14px;
        color: $text-secondary;
        margin: 0;
      }
    }
  }
}
</style>
