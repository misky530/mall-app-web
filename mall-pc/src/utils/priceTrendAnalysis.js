/**
 * 价格趋势分析工具 (P1功能)
 * 基于localStorage的历史订单分析商品价格变化趋势
 */

/**
 * 获取所有订单
 */
function getAllOrders() {
  const orders = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('order_')) {
      try {
        const order = JSON.parse(localStorage.getItem(key));
        orders.push(order);
      } catch (e) {
        console.error('解析订单失败:', e);
      }
    }
  }
  return orders.sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
}

/**
 * 分析单个商品的价格趋势
 * @param {number} productId - 商品ID
 * @returns {Object} 价格趋势数据
 */
export function analyzePriceTrend(productId) {
  const orders = getAllOrders();
  const priceHistory = [];

  // 从订单中提取该商品的价格历史
  orders.forEach(order => {
    const items = order.items || order.orderItemList || [];
    items.forEach(item => {
      const itemProductId = item.productId || item.id;
      if (itemProductId == productId) {
        priceHistory.push({
          date: new Date(order.createTime),
          price: item.price || item.productPrice || 0,
          quantity: item.quantity || item.productQuantity || 1,
          orderNo: order.orderNo || order.id
        });
      }
    });
  });

  // 如果没有历史数据,生成Demo数据
  if (priceHistory.length === 0) {
    return generateDemoPriceTrend(productId);
  }

  // 按时间排序
  priceHistory.sort((a, b) => a.date - b.date);

  // 计算统计数据
  const prices = priceHistory.map(h => h.price);
  const currentPrice = prices[prices.length - 1];
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceChange = prices.length >= 2
    ? ((currentPrice - prices[0]) / prices[0]) * 100
    : 0;

  // 预测趋势 (简单线性回归)
  const trend = calculateTrend(priceHistory);

  return {
    productId,
    priceHistory,
    currentPrice,
    avgPrice: Math.round(avgPrice),
    minPrice,
    maxPrice,
    priceChange: Math.round(priceChange * 10) / 10,
    trend, // 'up', 'down', 'stable'
    dataPoints: priceHistory.length,
    recommendation: generatePriceRecommendation(currentPrice, avgPrice, minPrice, trend)
  };
}

/**
 * 计算价格趋势方向
 */
function calculateTrend(priceHistory) {
  if (priceHistory.length < 3) return 'stable';

  // 简单移动平均
  const recentPrices = priceHistory.slice(-5).map(h => h.price);
  const earlyPrices = priceHistory.slice(0, Math.min(5, priceHistory.length - 5)).map(h => h.price);

  const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  const earlyAvg = earlyPrices.length > 0
    ? earlyPrices.reduce((a, b) => a + b, 0) / earlyPrices.length
    : recentAvg;

  const changePercent = ((recentAvg - earlyAvg) / earlyAvg) * 100;

  if (changePercent > 5) return 'up';
  if (changePercent < -5) return 'down';
  return 'stable';
}

/**
 * 生成价格建议
 */
function generatePriceRecommendation(currentPrice, avgPrice, minPrice, trend) {
  const recommendations = [];

  // 当前价格 vs 平均价格
  const diffFromAvg = ((currentPrice - avgPrice) / avgPrice) * 100;
  if (diffFromAvg < -10) {
    recommendations.push({
      type: 'buy',
      message: `当前价格比平均价低${Math.abs(Math.round(diffFromAvg))}%,建议采购`,
      icon: '📈'
    });
  } else if (diffFromAvg > 10) {
    recommendations.push({
      type: 'wait',
      message: `当前价格比平均价高${Math.round(diffFromAvg)}%,建议等待`,
      icon: '⏳'
    });
  }

  // 当前价格 vs 历史最低
  const diffFromMin = ((currentPrice - minPrice) / minPrice) * 100;
  if (diffFromMin < 5) {
    recommendations.push({
      type: 'buy',
      message: '接近历史最低价,建议批量采购',
      icon: '💰'
    });
  }

  // 趋势建议
  if (trend === 'up') {
    recommendations.push({
      type: 'buy',
      message: '价格呈上涨趋势,建议尽快采购',
      icon: '⬆️'
    });
  } else if (trend === 'down') {
    recommendations.push({
      type: 'wait',
      message: '价格呈下降趋势,可等待更低价格',
      icon: '⬇️'
    });
  } else {
    recommendations.push({
      type: 'normal',
      message: '价格稳定,按需采购',
      icon: '➡️'
    });
  }

  return recommendations;
}

/**
 * 批量分析多个商品的价格趋势
 */
export function analyzeBatchPriceTrends(productIds) {
  return productIds.map(id => analyzePriceTrend(id));
}

/**
 * 获取价格波动最大的商品
 */
export function getHighVolatilityProducts(limit = 5) {
  const orders = getAllOrders();
  const productPrices = {};

  // 收集所有商品的价格历史
  orders.forEach(order => {
    const items = order.items || order.orderItemList || [];
    items.forEach(item => {
      const productId = item.productId || item.id;
      if (!productPrices[productId]) {
        productPrices[productId] = {
          prices: [],
          name: item.productName,
          pic: item.productPic
        };
      }
      productPrices[productId].prices.push(item.price || item.productPrice || 0);
    });
  });

  // 计算波动率
  const volatilityList = Object.entries(productPrices)
    .filter(([_, data]) => data.prices.length >= 2)
    .map(([productId, data]) => {
      const prices = data.prices;
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance) / avgPrice * 100; // 变异系数

      return {
        productId,
        productName: data.name,
        productPic: data.pic,
        volatility: Math.round(volatility * 10) / 10,
        avgPrice: Math.round(avgPrice),
        priceCount: prices.length
      };
    })
    .sort((a, b) => b.volatility - a.volatility)
    .slice(0, limit);

  return volatilityList.length > 0 ? volatilityList : generateDemoVolatilityProducts();
}

/**
 * 生成Demo价格趋势数据
 */
function generateDemoPriceTrend(productId) {
  const now = new Date();
  const priceHistory = [];
  let basePrice = 5000 + Math.random() * 5000;

  // 生成过去6个月的价格数据
  for (let i = 180; i >= 0; i -= 30) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // 添加随机波动
    const fluctuation = (Math.random() - 0.5) * 0.2; // ±10%
    const price = Math.round(basePrice * (1 + fluctuation));

    priceHistory.push({
      date,
      price,
      quantity: Math.floor(Math.random() * 10) + 1,
      orderNo: `DEMO${date.getTime()}`
    });

    basePrice = price; // 下一个价格基于当前价格
  }

  const prices = priceHistory.map(h => h.price);
  const currentPrice = prices[prices.length - 1];
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

  return {
    productId,
    priceHistory,
    currentPrice,
    avgPrice: Math.round(avgPrice),
    minPrice,
    maxPrice,
    priceChange: Math.round(priceChange * 10) / 10,
    trend: priceChange > 5 ? 'up' : priceChange < -5 ? 'down' : 'stable',
    dataPoints: priceHistory.length,
    recommendation: generatePriceRecommendation(currentPrice, avgPrice, minPrice, priceChange > 5 ? 'up' : priceChange < -5 ? 'down' : 'stable')
  };
}

/**
 * 生成Demo波动率商品
 */
function generateDemoVolatilityProducts() {
  return [
    {
      productId: 26,
      productName: '华为 MateBook 14 2024款',
      productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      volatility: 15.8,
      avgPrice: 5499,
      priceCount: 6
    },
    {
      productId: 27,
      productName: '小米 Redmi G Pro 游戏本',
      productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      volatility: 12.3,
      avgPrice: 6999,
      priceCount: 5
    },
    {
      productId: 28,
      productName: 'Apple MacBook Pro 14英寸',
      productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      volatility: 8.5,
      avgPrice: 14999,
      priceCount: 4
    }
  ];
}

/**
 * 格式化价格趋势图表数据 (用于ECharts)
 */
export function formatPriceTrendForChart(trendData) {
  const dates = trendData.priceHistory.map(h =>
    h.date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  );
  const prices = trendData.priceHistory.map(h => h.price);

  return {
    dates,
    prices,
    avgPrice: trendData.avgPrice,
    minPrice: trendData.minPrice,
    maxPrice: trendData.maxPrice
  };
}
