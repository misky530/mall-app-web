/**
 * 商品API工具
 * 用于从真实API获取商品详情信息
 */

const API_BASE = 'https://portal-api.macrozheng.com'

/**
 * 获取商品详情
 * @param {number|string} productId - 商品ID
 * @returns {Promise<object>} 商品详情数据
 */
export async function fetchProductDetail(productId) {
  try {
    const response = await fetch(`${API_BASE}/product/detail/${productId}`)
    const result = await response.json()

    if (result.code === 200 && result.data) {
      return result.data
    }

    console.error('获取商品详情失败:', result)
    return null
  } catch (error) {
    console.error('获取商品详情出错:', error)
    return null
  }
}

/**
 * 批量获取商品详情
 * @param {Array<object>} items - 订单商品项数组，每项包含 productId
 * @returns {Promise<Array<object>>} 增强后的商品项数组
 */
export async function enrichOrderItems(items) {
  if (!items || items.length === 0) {
    return items
  }

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      // 如果已经有完整的商品信息（包括pic），则不需要重新获取
      if (item.pic && item.name && item.productPic && item.productName) {
        return item
      }

      // 尝试从 productId 或 id 获取商品详情
      const productId = item.productId || item.id
      if (!productId) {
        return item
      }

      const productDetail = await fetchProductDetail(productId)

      if (productDetail) {
        // 合并API数据和现有数据
        return {
          ...item,
          productId: productId,
          productName: item.productName || productDetail.name,
          productPic: item.productPic || productDetail.pic,
          pic: item.pic || productDetail.pic,
          name: item.name || productDetail.name,
          productPrice: item.productPrice ?? item.price ?? productDetail.price,
          price: item.price ?? item.productPrice ?? productDetail.price,
          productAttr: item.productAttr || item.spec || null,
          spec: item.spec || item.productAttr || null,
          productQuantity: item.productQuantity ?? item.quantity ?? 1,
          quantity: item.quantity ?? item.productQuantity ?? 1,
          productBrand: productDetail.brandName,
          productCategoryName: productDetail.productCategoryName
        }
      }

      return item
    })
  )

  return enrichedItems
}

/**
 * 为订单对象增强商品信息
 * @param {object} order - 订单对象
 * @returns {Promise<object>} 增强后的订单对象
 */
export async function enrichOrder(order) {
  if (!order) {
    return order
  }

  if (order.items && order.items.length > 0) {
    const enrichedItems = await enrichOrderItems(order.items)
    return {
      ...order,
      items: enrichedItems
    }
  }

  return order
}
