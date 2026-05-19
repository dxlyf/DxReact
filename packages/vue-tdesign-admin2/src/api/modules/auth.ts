import request from '../request'
import type { LoginParams, LoginResult, UserInfo } from '@/types/user'

export function loginApi(params: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', params)
}

export function logoutApi(): Promise<void> {
  return request.post('/auth/logout')
}

export function getUserInfoApi(): Promise<UserInfo> {
  return request.get('/auth/user-info')
}
