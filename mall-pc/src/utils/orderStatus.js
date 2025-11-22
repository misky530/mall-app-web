/**
 * B2B订单状态枚举
 */
export const ORDER_STATUS = {
  // 已下单
  CREATED: 'CREATED',
  // 买家已支付/待确认
  PAID_PENDING_VERIFY: 'PAID_PENDING_VERIFY',
  // 已确认/待发货
  PROCESSING: 'PROCESSING',
  // 已发货/待验收
  SHIPPED: 'SHIPPED',
  // 验收不通过/维权中
  INSPECTION_FAIL: 'INSPECTION_FAIL',
  // 验收通过/待结算
  COMPLETED: 'COMPLETED',
  // 已退款/关闭
  REFUNDED: 'REFUNDED',
  // 已结算
  SETTLED: 'SETTLED'
}

/**
 * 订单状态名称映射
 */
export const ORDER_STATUS_NAME = {
  [ORDER_STATUS.CREATED]: '待付款',
  [ORDER_STATUS.PAID_PENDING_VERIFY]: '待确认收款',
  [ORDER_STATUS.PROCESSING]: '待发货',
  [ORDER_STATUS.SHIPPED]: '待验收',
  [ORDER_STATUS.INSPECTION_FAIL]: '验收不通过',
  [ORDER_STATUS.COMPLETED]: '待结算',
  [ORDER_STATUS.REFUNDED]: '已退款',
  [ORDER_STATUS.SETTLED]: '已结算'
}

/**
 * 订单状态标签类型映射
 */
export const ORDER_STATUS_TAG_TYPE = {
  [ORDER_STATUS.CREATED]: 'warning',
  [ORDER_STATUS.PAID_PENDING_VERIFY]: 'info',
  [ORDER_STATUS.PROCESSING]: 'primary',
  [ORDER_STATUS.SHIPPED]: 'success',
  [ORDER_STATUS.INSPECTION_FAIL]: 'danger',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.REFUNDED]: 'info',
  [ORDER_STATUS.SETTLED]: 'success'
}

/**
 * 获取订单状态名称
 */
export function getOrderStatusName(status) {
  return ORDER_STATUS_NAME[status] || '未知状态'
}

/**
 * 获取订单状态标签类型
 */
export function getOrderStatusTagType(status) {
  return ORDER_STATUS_TAG_TYPE[status] || 'info'
}

/**
 * 检查订单状态是否可以执行某个操作
 */
export function canOperateOrder(status, operation) {
  const statusOperations = {
    [ORDER_STATUS.CREATED]: ['cancel', 'pay'],
    [ORDER_STATUS.PAID_PENDING_VERIFY]: ['uploadVoucher', 'viewDetail'],
    [ORDER_STATUS.PROCESSING]: ['viewDetail'], // 卖家端可以发货
    [ORDER_STATUS.SHIPPED]: ['inspect', 'viewLogistics'],
    [ORDER_STATUS.INSPECTION_FAIL]: ['viewDetail', 'viewDispute'],
    [ORDER_STATUS.COMPLETED]: ['viewDetail'],
    [ORDER_STATUS.REFUNDED]: ['viewDetail'],
    [ORDER_STATUS.SETTLED]: ['viewDetail']
  }

  return statusOperations[status]?.includes(operation) || false
}

/**
 * 订单状态流转图
 */
export const ORDER_STATUS_FLOW = {
  [ORDER_STATUS.CREATED]: [ORDER_STATUS.PAID_PENDING_VERIFY, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.PAID_PENDING_VERIFY]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.INSPECTION_FAIL],
  [ORDER_STATUS.INSPECTION_FAIL]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.SETTLED],
  [ORDER_STATUS.REFUNDED]: [],
  [ORDER_STATUS.SETTLED]: []
}

