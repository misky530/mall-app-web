import request from '@/utils/request'
import searchEngine from '@/utils/searchEngine'

/**
 * 搜索商品列表
 */
export function searchProductList(params) {
  return request({
    method: 'GET',
    url: '/product/search',
    params
  })
}

/**
 * 智能搜索 - 混合模式
 * 优先使用后端API，失败时自动降级到前端搜索
 * @param {Object} params - 搜索参数
 * @param {String} params.keyword - 搜索关键词
 * @param {Number} params.pageNum - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {Number} params.sort - 排序类型
 * @param {Object} filters - 额外筛选条件
 * @returns {Promise} 搜索结果
 */
export async function smartSearch(params, filters = {}) {
  const { keyword, pageNum = 1, pageSize = 24, sort = 0 } = params

  try {
    // 1. 优先尝试后端 API
    console.log('🌐 尝试使用后端搜索 API...')
    const res = await searchProductList(params)
    
    if (res && res.data && res.data.list) {
      console.log('✅ 后端搜索成功:', res.data.list.length, '个结果')
      return {
        list: res.data.list,
        total: res.data.total || res.data.list.length,
        source: 'api'
      }
    }
  } catch (error) {
    console.warn('⚠️ 后端搜索失败，切换到前端搜索:', error.message)
  }

  // 2. 降级到前端搜索引擎
  console.log('🔍 使用前端 Fuse.js 搜索引擎...')
  
  // 生成或加载 Mock 数据
  const mockData = generateMockProducts()
  searchEngine.setData(mockData)

  // 执行搜索
  let results = keyword ? searchEngine.search(keyword) : mockData.map(item => ({ item, score: 0 }))

  // 应用筛选条件
  results = searchEngine.applyFilters(results, filters)

  // 排序
  const sortType = getSortTypeFromValue(sort)
  results = searchEngine.sortResults(results, sortType)

  // 分页
  const start = (pageNum - 1) * pageSize
  const end = start + pageSize
  const paginatedResults = results.slice(start, end)

  console.log('✅ 前端搜索完成:', results.length, '个结果，显示', paginatedResults.length, '个')

  return {
    list: paginatedResults.map(r => r.item),
    total: results.length,
    source: 'local'
  }
}

/**
 * 排序值转换为类型
 */
function getSortTypeFromValue(sort) {
  const sortMap = {
    0: 'relevance',
    1: 'sale',
    2: 'price_asc',
    3: 'price_desc',
    4: 'new',
    5: 'comment'
  }
  return sortMap[sort] || 'relevance'
}

/**
 * 生成 Mock 商品数据
 */
function generateMockProducts() {
  const brands = [
    { id: 1, name: '华为', keywords: ['huawei', 'HUAWEI', '华为手机'] },
    { id: 2, name: '小米', keywords: ['xiaomi', 'mi', '小米手机'] },
    { id: 3, name: 'Apple', keywords: ['苹果', 'iPhone', 'iPad'] },
    { id: 4, name: '三星', keywords: ['Samsung', '三星手机'] },
    { id: 5, name: 'OPPO', keywords: ['oppo', 'OPPO手机'] },
    { id: 6, name: 'vivo', keywords: ['vivo', 'vivo手机'] },
    { id: 7, name: '荣耀', keywords: ['Honor', '荣耀手机'] },
    { id: 8, name: '真我', keywords: ['realme', '真我手机'] }
  ]

  const categories = [
    '5G手机', '游戏手机', '拍照手机', '商务手机', '学生手机', '老人机'
  ]

  const memories = ['6GB', '8GB', '12GB', '16GB', '18GB']
  const storages = ['128GB', '256GB', '512GB', '1TB']
  const features = [
    '双卡双待', '快速充电', '长续航', '高刷屏', '超清摄像',
    '5G全网通', 'NFC支付', '无线充电', '防水防尘', '旗舰芯片'
  ]

  const mockProducts = []

  for (let i = 1; i <= 100; i++) {
    const brand = brands[i % brands.length]
    const memory = memories[i % memories.length]
    const storage = storages[i % storages.length]
    const category = categories[i % categories.length]
    const feature1 = features[i % features.length]
    const feature2 = features[(i + 1) % features.length]

    const basePrice = Math.floor(Math.random() * 4000) + 1000
    const discountRate = 0.8 + Math.random() * 0.15

    mockProducts.push({
      id: 10000 + i,
      name: `${brand.name} ${category} ${memory}+${storage}`,
      subTitle: `${feature1} ${feature2} 旗舰新品`,
      price: Math.floor(basePrice * discountRate),
      originalPrice: basePrice,
      pic: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=400&h=400&fit=crop`,
      sale: Math.floor(Math.random() * 10000) + 100,
      stock: Math.floor(Math.random() * 500) + 50,
      commentCount: Math.floor(Math.random() * 5000) + 100,
      brandId: brand.id,
      brandName: brand.name,
      productCategoryId: (i % 6) + 1,
      categoryName: category,
      keywords: [...brand.keywords, memory, storage, feature1, feature2].join(' '),
      newStatus: Math.random() > 0.7 ? 1 : 0,
      recommendStatus: Math.random() > 0.5 ? 1 : 0,
      createTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return mockProducts
}

/**
 * 获取商品分类树
 */
export function fetchCategoryTreeList() {
  return request({
    method: 'GET',
    url: '/product/categoryTreeList'
  })
}

/**
 * 获取商品详情
 */
export function fetchProductDetail(id) {
  return request({
    method: 'GET',
    url: `/product/detail/${id}`
  })
}
