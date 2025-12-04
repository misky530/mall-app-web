import request from '@/utils/request'
import searchEngine from '@/utils/searchEngine'
import { smartSearch as aiSmartSearch, saveSearchHistory, getSearchInsights } from '@/utils/smartSearch'
import generateRichMockProducts from '@/data/mockProducts'

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
      const resultCount = res.data.list.length
      console.log('✅ 后端搜索成功:', resultCount, '个结果')
      
      // 🔑 关键优化：如果后端返回空结果，自动降级到前端搜索
      if (resultCount === 0 && keyword) {
        console.log('⚠️ 后端返回空结果，尝试前端智能搜索...')
        // 继续执行下面的前端搜索逻辑
      } else {
        return {
          list: res.data.list,
          total: res.data.total || res.data.list.length,
          source: 'api'
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ 后端搜索失败，切换到前端搜索:', error.message)
  }

  // 2. 降级到前端AI智能搜索引擎
  console.log('🔍 使用前端AI智能搜索引擎（支持同义词+规格识别）...')

  // 生成丰富的B2B商品数据(模拟京东企业购)
  const mockData = generateRichMockProducts()

  // 使用AI智能搜索（支持同义词、规格提取）
  let results = keyword ? aiSmartSearch(keyword, mockData) : mockData

  // 应用额外筛选条件
  if (filters.brandId) {
    results = results.filter(p => p.brandId === filters.brandId)
  }
  if (filters.categoryId) {
    results = results.filter(p => p.productCategoryId === filters.categoryId)
  }
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    results = results.filter(p => p.price >= filters.minPrice)
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    results = results.filter(p => p.price <= filters.maxPrice)
  }

  // 排序（AI搜索已按匹配分数排序，这里处理其他排序）
  const sortType = getSortTypeFromValue(sort)
  if (sortType !== 'relevance' && keyword) {
    results = sortResultsByType(results, sortType)
  } else if (!keyword) {
    results = sortResultsByType(results, sortType)
  }

  // 保存搜索历史
  if (keyword) {
    saveSearchHistory(keyword)
  }

  // 分页
  const start = (pageNum - 1) * pageSize
  const end = start + pageSize
  const paginatedResults = results.slice(start, end)

  // 获取搜索洞察
  const insights = keyword ? getSearchInsights(keyword, results) : []
  if (insights.length > 0) {
    console.log('🔍 搜索洞察:', insights.join(', '))
  }

  console.log('✅ AI智能搜索完成:', results.length, '个结果，显示', paginatedResults.length, '个')

  return {
    list: paginatedResults,
    total: results.length,
    source: 'local',
    insights
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
 * 按类型排序结果
 */
function sortResultsByType(results, sortType) {
  const sorted = [...results]

  switch (sortType) {
    case 'sale':
      return sorted.sort((a, b) => (b.sale || 0) - (a.sale || 0))
    case 'price_asc':
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
    case 'price_desc':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
    case 'new':
      return sorted.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
    case 'comment':
      return sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0))
    default:
      return sorted
  }
}

// 旧的generateMockProducts函数已移除，使用data/mockProducts.js中的丰富数据

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
