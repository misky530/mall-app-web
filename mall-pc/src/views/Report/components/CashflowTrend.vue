<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { getLast7DaysTrend } from '@/utils/reportData'

// 图表实例
const chartRef = ref(null)
let chartInstance = null

// 趋势数据
const trendData = ref([])

// 加载数据
const loadData = () => {
  trendData.value = getLast7DaysTrend()
  initChart()
}

// 计算汇总数据
const summary = computed(() => {
  if (trendData.value.length === 0) return { totalInflow: 0, totalOutflow: 0, netflow: 0 }

  const totalInflow = trendData.value.reduce((sum, day) => sum + day.inflow, 0)
  const totalOutflow = trendData.value.reduce((sum, day) => sum + day.outflow, 0)
  const netflow = totalInflow - totalOutflow

  return { totalInflow, totalOutflow, netflow }
})

// 格式化金额
const formatAmount = (amount) => {
  return amount ? `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}` : '¥0'
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const dates = trendData.value.map(d => d.date.substring(5)) // MM/DD
  const dayNames = trendData.value.map(d => d.dayName)
  const inflowData = trendData.value.map(d => d.inflow)
  const outflowData = trendData.value.map(d => d.outflow)
  const netflowData = trendData.value.map(d => d.netflow)

  const option = {
    title: {
      text: '资金流动趋势',
      left: 0,
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#262626'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#262626'
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: (params) => {
        const dataIndex = params[0].dataIndex
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${dates[dataIndex]} (${dayNames[dataIndex]})</div>`

        params.forEach(param => {
          const value = param.value
          const formattedValue = value >= 0
            ? `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`
            : `-¥${Math.abs(value).toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`

          result += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
              <span>
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
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
      data: ['流入', '流出', '净流量'],
      right: 0,
      top: 0,
      itemWidth: 20,
      itemHeight: 12,
      textStyle: {
        fontSize: 13
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          formatter: (value, index) => {
            return `${value}\n${dayNames[index]}`
          },
          fontSize: 12,
          color: '#8c8c8c'
        },
        axisLine: {
          lineStyle: {
            color: '#e8e8e8'
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '金额 (¥)',
        nameTextStyle: {
          color: '#8c8c8c',
          fontSize: 12
        },
        axisLabel: {
          formatter: (value) => {
            if (value >= 10000) {
              return `${(value / 10000).toFixed(1)}万`
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
      }
    ],
    series: [
      {
        name: '流入',
        type: 'bar',
        data: inflowData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52c41a' },
            { offset: 1, color: '#95de64' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '25%'
      },
      {
        name: '流出',
        type: 'bar',
        data: outflowData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ff4d4f' },
            { offset: 1, color: '#ff7875' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '25%'
      },
      {
        name: '净流量',
        type: 'line',
        data: netflowData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#1890ff'
        },
        itemStyle: {
          color: '#1890ff',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ])
        }
      }
    ]
  }

  chartInstance.setOption(option)

  // 响应式
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="cashflow-trend">
    <div class="section-header">
      <h3>近7天资金流动</h3>
      <p class="subtitle">Capital Flow Trend (Last 7 Days)</p>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="summary-card inflow">
        <div class="card-icon">↓</div>
        <div class="card-content">
          <div class="card-label">累计流入</div>
          <div class="card-value">{{ formatAmount(summary.totalInflow) }}</div>
        </div>
      </div>

      <div class="summary-card outflow">
        <div class="card-icon">↑</div>
        <div class="card-content">
          <div class="card-label">累计流出</div>
          <div class="card-value">{{ formatAmount(summary.totalOutflow) }}</div>
        </div>
      </div>

      <div class="summary-card netflow" :class="{ positive: summary.netflow >= 0, negative: summary.netflow < 0 }">
        <div class="card-icon">{{ summary.netflow >= 0 ? '✓' : '✗' }}</div>
        <div class="card-content">
          <div class="card-label">净流量</div>
          <div class="card-value">
            {{ summary.netflow >= 0 ? '+' : '' }}{{ formatAmount(summary.netflow) }}
          </div>
        </div>
      </div>
    </div>

    <!-- ECharts 图表 -->
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.cashflow-trend {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-size: 12px;
      color: $text-placeholder;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .summary-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid;

      &.inflow {
        background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
        border-color: #b7eb8f;

        .card-icon {
          background: #52c41a;
          color: white;
        }

        .card-value {
          color: #52c41a;
        }
      }

      &.outflow {
        background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
        border-color: #ffa39e;

        .card-icon {
          background: #ff4d4f;
          color: white;
        }

        .card-value {
          color: #ff4d4f;
        }
      }

      &.netflow {
        background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
        border-color: #91d5ff;

        .card-icon {
          background: #1890ff;
          color: white;
        }

        .card-value {
          color: #1890ff;
        }

        &.negative {
          background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
          border-color: #ffd591;

          .card-icon {
            background: #faad14;
          }

          .card-value {
            color: #faad14;
          }
        }
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .card-content {
        flex: 1;

        .card-label {
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 4px;
        }

        .card-value {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
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
