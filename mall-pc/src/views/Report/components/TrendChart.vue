<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { getLast7DaysTrend } from '@/utils/reportData'

// 图表实例
const chartRef = ref(null)
let chartInstance = null

// 时间范围选择
const timeRange = ref('7days')
const timeRangeOptions = [
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' }
]

// 趋势数据
const trendData = ref([])

// 加载数据
const loadData = () => {
  if (timeRange.value === '7days') {
    trendData.value = getLast7DaysTrend()
  } else {
    // 30天数据（简化处理，复制7天数据）
    const base = getLast7DaysTrend()
    trendData.value = []
    for (let i = 0; i < 30; i += 7) {
      trendData.value.push(...base)
    }
    trendData.value = trendData.value.slice(0, 30)
  }

  initChart()
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const dates = trendData.value.map(d => d.date.substring(5)) // MM/DD
  const inflowData = trendData.value.map(d => d.inflow)
  const outflowData = trendData.value.map(d => d.outflow)
  const netflowData = trendData.value.map(d => d.netflow)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#262626',
        fontSize: 13
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#d9d9d9',
          type: 'dashed'
        }
      },
      formatter: (params) => {
        const dataIndex = params[0].dataIndex
        let result = `<div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">${dates[dataIndex]}</div>`

        params.forEach(param => {
          const value = param.value
          const formattedValue = value >= 0
            ? `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`
            : `-¥${Math.abs(value).toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`

          result += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0;">
              <span style="display: flex; align-items: center;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${param.color}; margin-right: 8px;"></span>
                ${param.seriesName}
              </span>
              <span style="font-weight: 600; margin-left: 20px;">${formattedValue}</span>
            </div>
          `
        })

        return result
      }
    },
    legend: {
      data: ['流入金额', '流出金额', '净流量'],
      top: 10,
      right: 20,
      itemWidth: 16,
      itemHeight: 10,
      textStyle: {
        fontSize: 13,
        color: '#595959'
      }
    },
    grid: {
      left: 60,
      right: 40,
      bottom: 40,
      top: 60,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      axisLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        margin: 12
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: '金额（元）',
      nameTextStyle: {
        color: '#8c8c8c',
        fontSize: 12,
        padding: [0, 0, 0, 0]
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        formatter: (value) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`
          }
          return value
        },
        fontSize: 12,
        color: '#8c8c8c'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '流入金额',
        type: 'bar',
        data: inflowData,
        itemStyle: {
          color: '#52c41a',
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '20%',
        barGap: '10%'
      },
      {
        name: '流出金额',
        type: 'bar',
        data: outflowData,
        itemStyle: {
          color: '#ff4d4f',
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '20%'
      },
      {
        name: '净流量',
        type: 'line',
        data: netflowData,
        smooth: false,
        lineStyle: {
          width: 2,
          color: '#1890ff'
        },
        itemStyle: {
          color: '#1890ff',
          borderWidth: 0
        },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }

  chartInstance.setOption(option)

  // 响应式
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

// 切换时间范围
const handleTimeRangeChange = () => {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="trend-chart">
    <div class="chart-header">
      <div class="header-left">
        <h2>资金流动趋势</h2>
        <p class="subtitle">Capital Flow Trend Analysis</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
          <el-radio-button
            v-for="option in timeRangeOptions"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.trend-chart {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 24px;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8e8e8;

    .header-left {
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: #262626;
        margin: 0 0 4px 0;
      }

      .subtitle {
        font-size: 12px;
        color: #8c8c8c;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .header-right {
      :deep(.el-radio-group) {
        .el-radio-button__inner {
          padding: 8px 16px;
          font-size: 13px;
          border-color: #d9d9d9;
          color: #595959;
        }

        .el-radio-button__original-radio:checked + .el-radio-button__inner {
          background-color: #1890ff;
          border-color: #1890ff;
          color: white;
        }
      }
    }
  }

  .chart-container {
    width: 100%;
    height: 320px;
  }
}
</style>
