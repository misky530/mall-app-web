import request from '@/utils/request'

/**
 * 添加购物车商品
 */
export function addCartItem(data) {
  return request({
    method: 'POST',
    url: '/cart/add',
    data
  })
}

/**
 * 获取购物车列表
 */
export function fetchCartList() {
  return request({
    method: 'GET',
    url: '/cart/list'
  })
}

/**
 * 删除购物车商品
 */
export function deleteCartItem(params) {
  return request({
    method: 'POST',
    url: '/cart/delete',
    params
  })
}

/**
 * 更新购物车商品数量
 */
export function updateQuantity(params) {
  return request({
    method: 'GET',
    url: '/cart/update/quantity',
    params
  })
}

/**
 * 清空购物车
 */
export function clearCartList() {
  return request({
    method: 'POST',
    url: '/cart/clear'
  })
}
