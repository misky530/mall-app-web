/**
 * AI采购推荐工具
 * 基于localStorage的历史订单分析,智能推荐复购商品
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
  return orders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

/**
 * 分析采购周期和推荐
 * @returns {Array} 推荐列表
 */
export function analyzePurchaseCycle() {
  const orders = getAllOrders();

  if (orders.length === 0) {
    return [];
  }

  // 按商品分组
  const productOrders = {};
  orders.forEach(order => {
    const items = order.items || order.orderItemList || [];
    items.forEach(item => {
      const productId = item.productId || item.id;
      if (!productOrders[productId]) {
        productOrders[productId] = [];
      }
      productOrders[productId].push({
        date: new Date(order.createTime),
        quantity: item.quantity || item.productQuantity || 1,
        amount: item.price || item.productPrice || 0,
        productName: item.productName,
        productPic: item.productPic,
        order: order
      });
    });
  });

  // 计算推荐
  const recommendations = [];
  Object.entries(productOrders).forEach(([productId, purchases]) => {
    if (purchases.length < 1) return;

    // 按时间排序
    purchases.sort((a, b) => a.date - b.date);

    // 最后一次采购
    const lastPurchase = purchases[purchases.length - 1];
    const daysSinceLastPurchase = (new Date() - lastPurchase.date) / (1000 * 60 * 60 * 24);

    // 计算平均周期
    let avgCycle = 30; // 默认30天
    if (purchases.length >= 2) {
      const intervals = [];
      for (let i = 1; i < purchases.length; i++) {
        const days = (purchases[i].date - purchases[i - 1].date) / (1000 * 60 * 60 * 24);
        intervals.push(days);
      }
      avgCycle = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // 计算平均采购量
    const avgQuantity = Math.round(
      purchases.reduce((sum, p) => sum + p.quantity, 0) / purchases.length
    );

    // 计算紧急程度
    let urgency = 'low';
    if (daysSinceLastPurchase >= avgCycle) {
      urgency = 'high'; // 已超过周期
    } else if (daysSinceLastPurchase >= avgCycle * 0.8) {
      urgency = 'medium'; // 达到80%
    }

    // 价格变动
    const lastPrice = lastPurchase.amount;
    const avgPrice = purchases.reduce((sum, p) => sum + p.amount, 0) / purchases.length;
    const priceChange = ((lastPrice - avgPrice) / avgPrice) * 100;

    recommendations.push({
      productId,
      productName: lastPurchase.productName,
      productPic: lastPurchase.productPic,
      lastPurchaseDate: lastPurchase.date,
      avgCycle: Math.round(avgCycle),
      daysSince: Math.round(daysSinceLastPurchase),
      urgency,
      suggestedQuantity: avgQuantity,
      price: lastPrice,
      avgPrice: Math.round(avgPrice),
      priceChange: Math.round(priceChange * 10) / 10,
      purchaseCount: purchases.length
    });
  });

  // 按紧急程度和时间排序
  return recommendations
    .sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.daysSince - a.daysSince;
    })
    .slice(0, 10); // 最多返回10个推荐
}

/**
 * 生成Demo推荐数据
 */
export function generateDemoRecommendations() {
  const now = new Date();

  return [
    {
      productId: 26,
      productName: '华为 MateBook 14 2024款 笔记本电脑',
      productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      lastPurchaseDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      avgCycle: 30,
      daysSince: 28,
      urgency: 'medium',
      suggestedQuantity: 5,
      price: 5499,
      avgPrice: 5650,
      priceChange: -2.7,
      purchaseCount: 3
    },
    {
      productId: 27,
      productName: '小米 Redmi G Pro 游戏本',
      productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      lastPurchaseDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
      avgCycle: 45,
      daysSince: 50,
      urgency: 'high',
      suggestedQuantity: 3,
      price: 6999,
      avgPrice: 6999,
      priceChange: 0,
      purchaseCount: 2
    },
    {
      productId: 28,
      productName: 'Apple MacBook Pro 14英寸',
      productPic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      lastPurchaseDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      avgCycle: 60,
      daysSince: 15,
      urgency: 'low',
      suggestedQuantity: 2,
      price: 14999,
      avgPrice: 15500,
      priceChange: -3.2,
      purchaseCount: 4
    }
  ];
}

/**
 * 获取推荐(自动判断使用真实数据还是Demo)
 */
export function getPurchaseRecommendations() {
  const realRecommendations = analyzePurchaseCycle();

  // 如果真实数据少于3条,补充Demo数据
  if (realRecommendations.length < 3) {
    console.log('真实推荐数据不足,使用Demo数据演示');
    const demoData = generateDemoRecommendations();
    return [...realRecommendations, ...demoData].slice(0, 10);
  }

  return realRecommendations;
}

/**
 * 一键复购 - 添加到购物车
 */
export function addToCartFromRecommendation(recommendation) {
  // 从localStorage读取购物车
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // 检查是否已存在
  const existingIndex = cart.findIndex(item => item.productId === recommendation.productId);

  if (existingIndex >= 0) {
    // 增加数量
    cart[existingIndex].quantity += recommendation.suggestedQuantity;
  } else {
    // 添加新商品
    cart.push({
      productId: recommendation.productId,
      productName: recommendation.productName,
      productPic: recommendation.productPic,
      price: recommendation.price,
      quantity: recommendation.suggestedQuantity,
      addTime: new Date().toISOString()
    });
  }

  // 保存回localStorage
  localStorage.setItem('cart', JSON.stringify(cart));

  console.log(`已添加 ${recommendation.suggestedQuantity} 个 ${recommendation.productName} 到购物车`);

  return cart;
}

/**
 * 获取采购统计
 */
export function getPurchaseStatistics() {
  const orders = getAllOrders();
  const recommendations = analyzePurchaseCycle();

  return {
    totalOrders: orders.length,
    totalRecommendations: recommendations.length,
    highUrgency: recommendations.filter(r => r.urgency === 'high').length,
    mediumUrgency: recommendations.filter(r => r.urgency === 'medium').length,
    lowUrgency: recommendations.filter(r => r.urgency === 'low').length
  };
}
