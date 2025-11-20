import request from '@/utils/request'

/**
 * 生成确认订单信息
 */
export function generateConfirmOrder(data) {
  return request({
    method: 'POST',
    url: '/order/generateConfirmOrder',
    data
  })
}

/**
 * 生成订单
 */
export function generateOrder(data) {
  return request({
    method: 'POST',
    url: '/order/generateOrder',
    data
  })
}

/**
 * 获取订单列表
 */
export function fetchOrderList(params) {
  return request({
    method: 'GET',
    url: '/order/list',
    params
  })
}

/**
 * 支付成功回调
 */
export function payOrderSuccess(data) {
  return request({
    method: 'POST',
    url: '/order/paySuccess',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    data
  })
}

/**
 * 获取订单详情
 */
export function fetchOrderDetail(orderId) {
  return request({
    method: 'GET',
    url: `/order/detail/${orderId}`
  })
}

/**
 * 取消订单
 */
export function cancelUserOrder(data) {
  return request({
    method: 'POST',
    url: '/order/cancelUserOrder',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    data
  })
}

/**
 * 确认收货
 */
export function confirmReceiveOrder(data) {
  return request({
    method: 'POST',
    url: '/order/confirmReceiveOrder',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    data
  })
}

/**
 * 删除订单
 */
export function deleteUserOrder(data) {
  return request({
    method: 'POST',
    url: '/order/deleteOrder',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    data
  })
}

/**
 * 查询支付宝支付状态
 */
export function fetchAlipayStatus(params) {
  return request({
    method: 'GET',
    url: '/alipay/query',
    params
  })
}
