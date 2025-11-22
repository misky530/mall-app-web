import request from '@/utils/request'

/**
 * B2B担保交易相关API（Mock数据）
 * 注意：这些接口目前使用Mock数据，后端接口实现后需要替换
 */

/**
 * 获取经办人收款账户信息
 */
export function getPaymentAccount() {
  return request({
    method: 'GET',
    url: '/b2b/payment/account'
  })
}

/**
 * 上传付款凭证
 */
export function uploadPaymentVoucher(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/payment/voucher`,
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 提交付款凭证
 */
export function submitPaymentVoucher(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/payment/submit`,
    data
  })
}

/**
 * 确认收款（经办人）
 */
export function confirmPayment(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/payment/confirm`,
    data
  })
}

/**
 * 驳回收款（经办人）
 */
export function rejectPayment(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/payment/reject`,
    data
  })
}

/**
 * 提交验收结果（买家）
 */
export function submitInspection(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/inspection/submit`,
    data
  })
}

/**
 * 发货（卖家）
 */
export function shipOrder(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/ship`,
    data
  })
}

/**
 * 获取待确认收款订单列表（经办人）
 */
export function getPendingVerifyOrders(params) {
  return request({
    method: 'GET',
    url: '/b2b/agent/orders/pending-verify',
    params
  })
}

/**
 * 获取待结算订单列表（经办人）
 */
export function getPendingSettleOrders(params) {
  return request({
    method: 'GET',
    url: '/b2b/agent/orders/pending-settle',
    params
  })
}

/**
 * 确认结算（经办人）
 */
export function confirmSettlement(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/settlement/confirm`,
    data
  })
}

/**
 * 处理验收异议（经办人）
 */
export function handleInspectionDispute(orderId, data) {
  return request({
    method: 'POST',
    url: `/b2b/order/${orderId}/inspection/dispute`,
    data
  })
}

/**
 * 获取卖家订单列表
 */
export function getSellerOrderList(params) {
  return request({
    method: 'GET',
    url: '/b2b/seller/orders',
    params
  })
}

/**
 * 获取卖家财务看板
 */
export function getSellerFinanceDashboard() {
  return request({
    method: 'GET',
    url: '/b2b/seller/finance/dashboard'
  })
}

