import request from '@/utils/request'

/**
 * 获取购物车列表
 */
export function getCartList() {
  return request({
    url: '/cart/list',
    method: 'get'
  })
}

/**
 * 添加商品到购物车
 * @param {object} data - { productId, skuId, quantity }
 */
export function addToCart(data) {
  return request({
    url: '/cart/add',
    method: 'post',
    data
  })
}

/**
 * 更新购物车商品数量
 * @param {object} data - { cartId, quantity }
 */
export function updateCartItemQuantity(data) {
  return request({
    url: `/cart/update/quantity`,
    method: 'post',
    data
  })
}

/**
 * 移除购物车商品
 * @param {object} data - { cartIds }
 */
export function removeCartItems(data) {
  return request({
    url: `/cart/delete`,
    method: 'post',
    data
  })
}

/**
 * 全选或取消全选购物车
 * @param {object} data - { checked }
 */
export function checkAllCartItems(data) {
  return request({
    url: '/cart/checkAll',
    method: 'post',
    data
  })
}

/**
 * 获取购物车商品总数
 */
export function getCartItemCount() {
    return request({
        url: '/cart/getProductCount',
        method: 'get'
    })
}