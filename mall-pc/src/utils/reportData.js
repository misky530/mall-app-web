/**
 * 报表数据服务
 * 从API获取订单数据并进行统计分析
 */

import { fetchOrderList } from '@/api/order';

// 缓存订单数据以减少API调用
let cachedOrders = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取所有B2B订单
 * @returns {Promise<Array>} 订单列表
 */
export async function getAllB2BOrders() {
  // 检查缓存
  const now = Date.now();
  if (cachedOrders && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    console.log('使用缓存的订单数据');
    return cachedOrders;
  }

  try {
    console.log('从API获取订单数据...');
    const response = await fetchOrderList({
      pageNum: 1,
      pageSize: 1000 // 获取足够多的订单用于统计
    });

    if (response && response.data) {
      // 过滤出B2B托管订单 (payType === 3)
      const orders = response.data.list || [];
      const b2bOrders = orders.filter(order => order.payType === 3);

      console.log(`成功获取 ${b2bOrders.length} 个B2B托管订单`);

      // 更新缓存
      cachedOrders = b2bOrders;
      cacheTime = now;

      return b2bOrders;
    }

    console.warn('API返回数据为空');
    return [];
  } catch (error) {
    console.error('获取订单数据失败:', error);
    // 如果API失败,返回空数组或缓存数据
    return cachedOrders || [];
  }
}

/**
 * 清除缓存
 */
export function clearOrderCache() {
  cachedOrders = null;
  cacheTime = null;
  console.log('订单缓存已清除');
}

/**
 * 按状态统计资金
 * @returns {Promise<Object>} 资金统计数据
 */
export async function getCapitalByStatus() {
  const orders = await getAllB2BOrders();

  const result = {
    // status: 0 - 待付款
    // status: 1 - 待发货
    // status: 2 - 已发货
    // status: 3 - 已完成
    // status: 4 - 已关闭
    // status: 5 - 无效订单

    // B2B托管流程状态映射:
    // 0 - 待确认收款 (对应订单status=0或刚提交凭证)
    pendingVerify: {
      amount: 0,
      count: 0,
      orders: []
    },
    // 1 - 已确认待发货 (对应订单status=1)
    pendingShip: {
      amount: 0,
      count: 0,
      orders: []
    },
    // 2 - 已发货待验收 (对应订单status=2)
    pendingAcceptance: {
      amount: 0,
      count: 0,
      orders: []
    },
    // 3 - 验收通过待结算 (对应特殊标记或status=2超过一定时间)
    pendingSettlement: {
      amount: 0,
      count: 0,
      orders: []
    },
    // 4 - 已完成 (对应订单status=3)
    completed: {
      amount: 0,
      count: 0,
      orders: []
    },
    // 总监管资金 (status 0-3)
    total: 0,
    totalCount: 0
  };

  orders.forEach(order => {
    const amount = order.payAmount || order.totalAmount || 0;

    // 根据订单状态分类
    switch (order.status) {
      case 0: // 待付款 - 视为待确认收款
        result.pendingVerify.amount += amount;
        result.pendingVerify.count++;
        result.pendingVerify.orders.push(order);
        result.total += amount;
        result.totalCount++;
        break;
      case 1: // 待发货 - 已确认待发货
        result.pendingShip.amount += amount;
        result.pendingShip.count++;
        result.pendingShip.orders.push(order);
        result.total += amount;
        result.totalCount++;
        break;
      case 2: // 已发货 - 待验收
        // 如果已发货超过7天,视为待结算
        const shipTime = order.deliveryTime ? new Date(order.deliveryTime) : new Date(order.modifyTime);
        const daysSinceShip = (new Date() - shipTime) / (1000 * 60 * 60 * 24);

        if (daysSinceShip > 7) {
          result.pendingSettlement.amount += amount;
          result.pendingSettlement.count++;
          result.pendingSettlement.orders.push(order);
        } else {
          result.pendingAcceptance.amount += amount;
          result.pendingAcceptance.count++;
          result.pendingAcceptance.orders.push(order);
        }
        result.total += amount;
        result.totalCount++;
        break;
      case 3: // 已完成
        result.completed.amount += amount;
        result.completed.count++;
        result.completed.orders.push(order);
        break;
      // status 4(已关闭) 和 5(无效订单) 不统计
    }
  });

  return result;
}

/**
 * 获取超时订单
 * @returns {Promise<Object>} 超时订单列表
 */
export async function getOvertimeOrders() {
  const orders = await getAllB2BOrders();
  const now = new Date();

  const result = {
    // 超48小时未确认收款
    over48HoursPendingVerify: [],
    // 超24小时待确认
    over24HoursPendingVerify: [],
    // 超15天未结算
    over15DaysPendingSettlement: [],
    // 超7天未验收
    over7DaysPendingAcceptance: []
  };

  orders.forEach(order => {
    const createTime = new Date(order.createTime);
    const hoursDiff = (now - createTime) / (1000 * 60 * 60);

    // 待确认收款超时 (status=0)
    if (order.status === 0) {
      if (hoursDiff > 48) {
        result.over48HoursPendingVerify.push({
          ...order,
          overtimeHours: Math.floor(hoursDiff)
        });
      } else if (hoursDiff > 24) {
        result.over24HoursPendingVerify.push({
          ...order,
          overtimeHours: Math.floor(hoursDiff)
        });
      }
    }

    // 已发货超7天未验收 (status=2)
    if (order.status === 2) {
      const shipTime = order.deliveryTime ? new Date(order.deliveryTime) : new Date(order.modifyTime);
      const daysSinceShip = (now - shipTime) / (1000 * 60 * 60 * 24);

      if (daysSinceShip > 7) {
        // 超15天视为待结算超时
        if (daysSinceShip > 15) {
          result.over15DaysPendingSettlement.push({
            ...order,
            overtimeDays: Math.floor(daysSinceShip)
          });
        } else {
          result.over7DaysPendingAcceptance.push({
            ...order,
            daysSinceShip: Math.floor(daysSinceShip)
          });
        }
      }
    }
  });

  return result;
}

/**
 * 获取今日数据统计
 * @returns {Promise<Object>} 今日统计数据
 */
export async function getTodayStats() {
  const orders = await getAllB2BOrders();
  const today = new Date().toLocaleDateString('zh-CN');

  const result = {
    todayVerified: { amount: 0, count: 0 }, // 今日确认收款
    todaySettled: { amount: 0, count: 0 },  // 今日结算
    todayCreated: { amount: 0, count: 0 }   // 今日创建订单
  };

  orders.forEach(order => {
    const amount = order.payAmount || order.totalAmount || 0;

    // 今日创建订单
    if (order.createTime && new Date(order.createTime).toLocaleDateString('zh-CN') === today) {
      result.todayCreated.amount += amount;
      result.todayCreated.count++;
    }

    // 今日确认收款 (从status 0->1的订单)
    if (order.status >= 1 && order.paymentTime) {
      if (new Date(order.paymentTime).toLocaleDateString('zh-CN') === today) {
        result.todayVerified.amount += amount;
        result.todayVerified.count++;
      }
    }

    // 今日结算 (status=3完成的订单)
    if (order.status === 3 && order.endTime) {
      if (new Date(order.endTime).toLocaleDateString('zh-CN') === today) {
        result.todaySettled.amount += amount;
        result.todaySettled.count++;
      }
    }
  });

  // 计算净流入
  result.netInflow = result.todayVerified.amount - result.todaySettled.amount;

  return result;
}

/**
 * 获取近7天资金流动趋势
 * @returns {Promise<Array>} 7天趋势数据
 */
export async function getLast7DaysTrend() {
  const orders = await getAllB2BOrders();
  const trends = [];

  // 生成近7天日期
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('zh-CN');
    const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

    const dayData = {
      date: dateStr,
      dayName,
      inflow: 0,    // 流入(确认收款)
      outflow: 0,   // 流出(结算)
      netflow: 0    // 净流量
    };

    orders.forEach(order => {
      const amount = order.payAmount || order.totalAmount || 0;

      // 统计当天确认收款 (从status 0->1)
      if (order.status >= 1 && order.paymentTime) {
        if (new Date(order.paymentTime).toLocaleDateString('zh-CN') === dateStr) {
          dayData.inflow += amount;
        }
      }

      // 统计当天结算 (status=3完成)
      if (order.status === 3 && order.endTime) {
        if (new Date(order.endTime).toLocaleDateString('zh-CN') === dateStr) {
          dayData.outflow += amount;
        }
      }
    });

    dayData.netflow = dayData.inflow - dayData.outflow;
    trends.push(dayData);
  }

  return trends;
}

/**
 * 获取争议/售后订单
 * @returns {Promise<Array>} 争议订单列表
 */
export async function getDisputeOrders() {
  const orders = await getAllB2BOrders();

  // 过滤出有问题的订单
  return orders.filter(order => {
    // status: 4 已关闭(可能是取消), 5 无效订单
    // 或者有特殊的争议标记
    return order.status === 4 || order.status === 5 || order.deleteStatus === 1;
  });
}

/**
 * 计算平均资金占用周期
 * @returns {Promise<number>} 平均天数
 */
export async function getAverageCycleDays() {
  const orders = await getAllB2BOrders();
  const completedOrders = orders.filter(order => order.status === 3);

  if (completedOrders.length === 0) return 0;

  let totalDays = 0;
  let validCount = 0;

  completedOrders.forEach(order => {
    if (order.createTime && order.endTime) {
      const createTime = new Date(order.createTime);
      const endTime = new Date(order.endTime);
      const days = (endTime - createTime) / (1000 * 60 * 60 * 24);
      totalDays += days;
      validCount++;
    }
  });

  return validCount > 0 ? (totalDays / validCount).toFixed(1) : 0;
}

/**
 * 生成Mock数据（如果API没有足够数据）
 * 注意: 现在这个函数主要用于开发测试
 */
export function generateMockOrdersIfNeeded() {
  console.log('现在使用真实API数据,不再需要生成Mock数据');
  // 保留这个函数以兼容现有代码,但不再生成mock数据
  return [];
}
