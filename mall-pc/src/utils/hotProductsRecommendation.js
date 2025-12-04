/**
 * 热门商品推荐工具
 * 基于浏览量、销量、评分等多维度计算商品热度
 */

import generateRichMockProducts from '@/data/mockProducts'

/**
 * 从localStorage模拟获取商品统计数据
 */
function getProductStats(productId) {
  const key = `product_stats_${productId}`;
  const stats = localStorage.getItem(key);

  if (stats) {
    return JSON.parse(stats);
  }

  // 如果没有数据,生成模拟数据
  const mockStats = {
    views: Math.floor(Math.random() * 5000) + 100,
    sales: Math.floor(Math.random() * 500) + 10,
    revenue: 0,
    rating: 4.0 + Math.random() * 0.9, // 4.0-4.9
    addToCartCount: Math.floor(Math.random() * 200) + 20,
    favoriteCount: Math.floor(Math.random() * 100) + 10
  };

  // 保存模拟数据
  localStorage.setItem(key, JSON.stringify(mockStats));

  return mockStats;
}

/**
 * 计算商品热度分数
 */
function calculateHotScore(product, stats) {
  // 热度计算公式:
  // 热度 = 浏览量×0.2 + 销量×0.3 + 加购数×0.2 + 收藏数×0.1 + 评分×10×0.2
  const hotScore =
    (stats.views || 0) * 0.2 +
    (stats.sales || 0) * 0.3 +
    (stats.addToCartCount || 0) * 0.2 +
    (stats.favoriteCount || 0) * 0.1 +
    (stats.rating || 4.0) * 10 * 0.2;

  return Math.round(hotScore * 10) / 10;
}

/**
 * 获取热门商品列表
 */
export function getHotProducts(limit = 10) {
  // 从localStorage读取商品列表
  const products = getAllProducts();

  if (products.length === 0) {
    return generateDemoHotProducts();
  }

  // 计算每个商品的热度
  const productsWithHotScore = products.map(product => {
    const stats = getProductStats(product.id);
    const hotScore = calculateHotScore(product, stats);

    return {
      ...product,
      hotScore,
      stats,
      tags: generateProductTags(product, stats)
    };
  });

  // 按热度排序
  return productsWithHotScore
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit);
}

/**
 * 按分类获取热门商品
 */
export function getHotProductsByCategory(categoryId, limit = 5) {
  const hotProducts = getHotProducts(100); // 先获取更多数据
  return hotProducts
    .filter(p => p.productCategoryId === categoryId || p.categoryId === categoryId)
    .slice(0, limit);
}

/**
 * 生成商品标签
 */
function generateProductTags(product, stats) {
  const tags = [];

  // 热销标签
  if (stats.sales > 100) {
    tags.push({ text: '热销', type: 'danger' });
  }

  // 新品标签(创建时间在30天内)
  const createDate = new Date(product.createTime || product.publishTime);
  const daysSinceCreate = (new Date() - createDate) / (1000 * 60 * 60 * 24);
  if (daysSinceCreate < 30) {
    tags.push({ text: '新品', type: 'success' });
  }

  // 降价标签
  if (product.originalPrice && product.price < product.originalPrice) {
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);
    if (discount > 10) {
      tags.push({ text: `降${discount}%`, type: 'warning' });
    }
  }

  // 好评标签
  if (stats.rating >= 4.8) {
    tags.push({ text: '好评', type: 'success' });
  }

  return tags;
}

/**
 * 获取所有商品(模拟)
 */
function getAllProducts() {
  // 直接使用丰富的B2B商品数据
  return generateRichMockProducts();
}

/**
 * 生成Demo热门商品数据
 */
export function generateDemoHotProducts() {
  return [
    {
      id: 26,
      name: '华为 MateBook 14 2024款',
      pic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      price: 5499,
      originalPrice: 6499,
      hotScore: 95.8,
      stats: {
        views: 15420,
        sales: 892,
        rating: 4.9,
        addToCartCount: 1200,
        favoriteCount: 450
      },
      tags: [
        { text: '热销', type: 'danger' },
        { text: '新品', type: 'success' },
        { text: '降15%', type: 'warning' }
      ]
    },
    {
      id: 27,
      name: '小米 Redmi G Pro 游戏本',
      pic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      price: 6999,
      hotScore: 88.5,
      stats: {
        views: 8920,
        sales: 456,
        rating: 4.8,
        addToCartCount: 680,
        favoriteCount: 320
      },
      tags: [
        { text: '热销', type: 'danger' },
        { text: '好评', type: 'success' }
      ]
    },
    {
      id: 28,
      name: 'Apple MacBook Pro 14英寸',
      pic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      price: 14999,
      originalPrice: 15999,
      hotScore: 85.2,
      stats: {
        views: 12500,
        sales: 328,
        rating: 4.9,
        addToCartCount: 520,
        favoriteCount: 280
      },
      tags: [
        { text: '好评', type: 'success' },
        { text: '降6%', type: 'warning' }
      ]
    },
    {
      id: 29,
      name: '戴尔 XPS 13 超轻薄本',
      pic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      price: 7999,
      hotScore: 78.9,
      stats: {
        views: 6800,
        sales: 234,
        rating: 4.7,
        addToCartCount: 380,
        favoriteCount: 190
      },
      tags: [
        { text: '热销', type: 'danger' }
      ]
    },
    {
      id: 30,
      name: '联想 ThinkPad X1 Carbon',
      pic: 'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20180607/5ac1bf59Ndefaac16.jpg',
      price: 9999,
      originalPrice: 11999,
      hotScore: 75.6,
      stats: {
        views: 5400,
        sales: 189,
        rating: 4.8,
        addToCartCount: 290,
        favoriteCount: 150
      },
      tags: [
        { text: '降17%', type: 'warning' },
        { text: '好评', type: 'success' }
      ]
    }
  ];
}

/**
 * 记录商品浏览
 */
export function recordProductView(productId) {
  const stats = getProductStats(productId);
  stats.views = (stats.views || 0) + 1;
  localStorage.setItem(`product_stats_${productId}`, JSON.stringify(stats));
}

/**
 * 记录商品销售
 */
export function recordProductSale(productId, quantity = 1) {
  const stats = getProductStats(productId);
  stats.sales = (stats.sales || 0) + quantity;
  localStorage.setItem(`product_stats_${productId}`, JSON.stringify(stats));
}

/**
 * 更新商品评分
 */
export function updateProductRating(productId, rating) {
  const stats = getProductStats(productId);
  // 简单平均(实际应该加权平均)
  stats.rating = ((stats.rating || 4.0) + rating) / 2;
  localStorage.setItem(`product_stats_${productId}`, JSON.stringify(stats));
}
