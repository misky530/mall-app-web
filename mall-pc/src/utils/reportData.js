/**
 * 报表数据服务
 * 从localStorage读取订单数据并进行统计分析
 */

/**
 * 获取所有B2B订单
 */
export function getAllB2BOrders() {
  const orders = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('order_')) {
      const orderData = localStorage.getItem(key)
      if (orderData) {
        try {
          const order = JSON.parse(orderData)
          // 只统计B2B订单 (payType === 3)
          if (order.payType === 3) {
            orders.push(order)
          }
        } catch (e) {
          console.error('解析订单数据失败:', e)
        }
      }
    }
  }
  return orders
}

/**
 * 按状态统计资金
 */
export function getCapitalByStatus() {
  const orders = getAllB2BOrders()

  const result = {
    // status: 0 - 待确认收款
    pendingVerify: {
      amount: 0,
      count: 0,
      orders: []
    },
    // status: 1 - 已确认待发货
    pendingShip: {
      amount: 0,
      count: 0,
      orders: []
    },
    // status: 2 - 已发货待验收
    pendingAcceptance: {
      amount: 0,
      count: 0,
      orders: []
    },
    // status: 3 - 验收通过待结算
    pendingSettlement: {
      amount: 0,
      count: 0,
      orders: []
    },
    // status: 4 - 已完成
    completed: {
      amount: 0,
      count: 0,
      orders: []
    },
    // 总监管资金 (status 0-3)
    total: 0,
    totalCount: 0
  }

  orders.forEach(order => {
    const amount = order.payAmount || 0

    switch (order.status) {
      case 0:
        result.pendingVerify.amount += amount
        result.pendingVerify.count++
        result.pendingVerify.orders.push(order)
        result.total += amount
        result.totalCount++
        break
      case 1:
        result.pendingShip.amount += amount
        result.pendingShip.count++
        result.pendingShip.orders.push(order)
        result.total += amount
        result.totalCount++
        break
      case 2:
        result.pendingAcceptance.amount += amount
        result.pendingAcceptance.count++
        result.pendingAcceptance.orders.push(order)
        result.total += amount
        result.totalCount++
        break
      case 3:
        result.pendingSettlement.amount += amount
        result.pendingSettlement.count++
        result.pendingSettlement.orders.push(order)
        result.total += amount
        result.totalCount++
        break
      case 4:
        result.completed.amount += amount
        result.completed.count++
        result.completed.orders.push(order)
        break
    }
  })

  return result
}

/**
 * 获取超时订单
 */
export function getOvertimeOrders() {
  const orders = getAllB2BOrders()
  const now = new Date()

  const result = {
    // 超48小时未确认收款
    over48HoursPendingVerify: [],
    // 超24小时待确认
    over24HoursPendingVerify: [],
    // 超15天未结算
    over15DaysPendingSettlement: [],
    // 超7天未验收
    over7DaysPendingAcceptance: []
  }

  orders.forEach(order => {
    const createTime = new Date(order.createTime || order.submitVoucherTime)
    const hoursDiff = (now - createTime) / (1000 * 60 * 60)
    const daysDiff = hoursDiff / 24

    // 待确认收款超时
    if (order.status === 0) {
      if (hoursDiff > 48) {
        result.over48HoursPendingVerify.push({
          ...order,
          overtimeHours: Math.floor(hoursDiff)
        })
      } else if (hoursDiff > 24) {
        result.over24HoursPendingVerify.push({
          ...order,
          overtimeHours: Math.floor(hoursDiff)
        })
      }
    }

    // 待结算超时
    if (order.status === 3) {
      if (daysDiff > 15) {
        result.over15DaysPendingSettlement.push({
          ...order,
          overtimeDays: Math.floor(daysDiff)
        })
      }
    }

    // 已发货超7天未验收
    if (order.status === 2 && order.shipTime) {
      const shipTime = new Date(order.shipTime)
      const daysSinceShip = (now - shipTime) / (1000 * 60 * 60 * 24)
      if (daysSinceShip > 7) {
        result.over7DaysPendingAcceptance.push({
          ...order,
          daysSinceShip: Math.floor(daysSinceShip)
        })
      }
    }
  })

  return result
}

/**
 * 获取今日数据统计
 */
export function getTodayStats() {
  const orders = getAllB2BOrders()
  const today = new Date().toLocaleDateString('zh-CN')

  const result = {
    todayVerified: { amount: 0, count: 0 }, // 今日确认收款
    todaySettled: { amount: 0, count: 0 },  // 今日结算
    todayCreated: { amount: 0, count: 0 }   // 今日创建订单
  }

  orders.forEach(order => {
    // 今日确认收款
    if (order.verifyTime && new Date(order.verifyTime).toLocaleDateString('zh-CN') === today) {
      result.todayVerified.amount += order.payAmount || 0
      result.todayVerified.count++
    }

    // 今日结算
    if (order.settlementTime && new Date(order.settlementTime).toLocaleDateString('zh-CN') === today) {
      result.todaySettled.amount += order.payAmount || 0
      result.todaySettled.count++
    }

    // 今日创建
    if (order.createTime && new Date(order.createTime).toLocaleDateString('zh-CN') === today) {
      result.todayCreated.amount += order.payAmount || 0
      result.todayCreated.count++
    }
  })

  // 计算净流入
  result.netInflow = result.todayVerified.amount - result.todaySettled.amount

  return result
}

/**
 * 获取近7天资金流动趋势
 */
export function getLast7DaysTrend() {
  const orders = getAllB2BOrders()
  const trends = []

  // 生成近7天日期
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('zh-CN')
    const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

    const dayData = {
      date: dateStr,
      dayName,
      inflow: 0,    // 流入(确认收款)
      outflow: 0,   // 流出(结算)
      netflow: 0    // 净流量
    }

    orders.forEach(order => {
      const amount = order.payAmount || 0

      // 统计当天确认收款
      if (order.verifyTime && new Date(order.verifyTime).toLocaleDateString('zh-CN') === dateStr) {
        dayData.inflow += amount
      }

      // 统计当天结算
      if (order.settlementTime && new Date(order.settlementTime).toLocaleDateString('zh-CN') === dateStr) {
        dayData.outflow += amount
      }
    })

    dayData.netflow = dayData.inflow - dayData.outflow
    trends.push(dayData)
  }

  return trends
}

/**
 * 获取争议/售后订单
 */
export function getDisputeOrders() {
  const orders = getAllB2BOrders()

  return orders.filter(order => {
    // status: -1 付款驳回, -2 验收失败, -3 仲裁完成
    return order.status === -1 || order.status === -2 || order.status === -3
  })
}

/**
 * 计算平均资金占用周期
 */
export function getAverageCycleDays() {
  const completedOrders = getAllB2BOrders().filter(order => order.status === 4)

  if (completedOrders.length === 0) return 0

  let totalDays = 0
  let validCount = 0

  completedOrders.forEach(order => {
    if (order.createTime && order.settlementTime) {
      const createTime = new Date(order.createTime)
      const settlementTime = new Date(order.settlementTime)
      const days = (settlementTime - createTime) / (1000 * 60 * 60 * 24)
      totalDays += days
      validCount++
    }
  })

  return validCount > 0 ? (totalDays / validCount).toFixed(1) : 0
}

/**
 * 生成Mock数据（如果localStorage没有足够数据）
 */
export function generateMockOrdersIfNeeded() {
  const orders = getAllB2BOrders()

  // 如果订单少于10个，生成一些Mock数据用于演示
  if (orders.length < 10) {
    const mockOrders = []
    const now = new Date()

    // 生成各种状态的订单
    const statuses = [0, 0, 0, 1, 1, 2, 2, 2, 3, 3]

    statuses.forEach((status, index) => {
      const orderId = `mock_${Date.now()}_${index}`
      const amount = Math.floor(Math.random() * 50000) + 10000

      const createTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)

      const order = {
        id: orderId,
        orderSn: `ESC${Date.now()}${index}`,
        status,
        statusName: ['待确认收款', '待发货', '已发货', '待结算', '已完成'][status] || '待确认收款',
        payAmount: amount,
        payType: 3,
        payTypeName: 'B2B托管',
        createTime: createTime.toLocaleString('zh-CN'),
        submitVoucherTime: createTime.toLocaleString('zh-CN'),
        receiverName: `买家${index + 1}`,
        receiverPhone: '138****5678',
        items: [
          {
            productId: 26,
            productName: 'Demo商品',
            productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
            price: amount / Math.ceil(Math.random() * 3 + 1),
            quantity: Math.ceil(Math.random() * 3 + 1)
          }
        ]
      }

      // 根据状态添加额外字段
      if (status >= 1) {
        order.verifyTime = new Date(createTime.getTime() + 2 * 60 * 60 * 1000).toLocaleString('zh-CN')
      }
      if (status >= 2) {
        order.shipTime = new Date(createTime.getTime() + 10 * 60 * 60 * 1000).toLocaleString('zh-CN')
      }
      if (status >= 4) {
        order.settlementTime = new Date(createTime.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN')
      }

      localStorage.setItem(`order_${orderId}`, JSON.stringify(order))
      mockOrders.push(order)
    })

    console.log(`已生成 ${mockOrders.length} 个Mock订单用于报表演示`)
    return mockOrders
  }

  return orders
}
