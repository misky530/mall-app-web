import request from '@/utils/request'

/**
 * 用户登录
 */
export function memberLogin(data) {
  return request({
    method: 'POST',
    url: '/sso/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    data
  })
}

/**
 * 获取用户信息
 */
export function memberInfo() {
  return request({
    method: 'GET',
    url: '/sso/info'
  })
}

/**
 * 用户注册
 */
export function memberRegister(data) {
  return request({
    method: 'POST',
    url: '/sso/register',
    data
  })
}
