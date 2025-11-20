/**
 * 本地存储工具
 */

export const storage = {
  // 设置存储
  set(key, value) {
    try {
      const data = JSON.stringify(value)
      localStorage.setItem(key, data)
    } catch (error) {
      console.error('存储数据失败：', error)
    }
  },

  // 获取存储
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error('读取数据失败：', error)
      return defaultValue
    }
  },

  // 删除存储
  remove(key) {
    localStorage.removeItem(key)
  },

  // 清空存储
  clear() {
    localStorage.clear()
  }
}

export default storage
