import request from '@/utils/request'

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
