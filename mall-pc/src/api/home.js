import request from '@/utils/request'

/**
 * 获取首页全部内容（包含轮播、品牌、秒杀、新品、热销等）
 */
export function fetchContent() {
  return request({
    method: 'GET',
    url: '/home/content'
  })
}

/**
 * 获取推荐商品列表
 */
export function fetchRecommendProductList(params) {
  return request({
    method: 'GET',
    url: '/home/recommendProductList',
    params
  })
}

/**
 * 获取商品分类列表
 */
export function fetchProductCateList(parentId) {
  return request({
    method: 'GET',
    url: `/home/productCateList/${parentId}`
  })
}

/**
 * 获取新品列表
 */
export function fetchNewProductList(params) {
  return request({
    method: 'GET',
    url: '/home/newProductList',
    params
  })
}

/**
 * 获取热销商品列表
 */
export function fetchHotProductList(params) {
  return request({
    method: 'GET',
    url: '/home/hotProductList',
    params
  })
}
