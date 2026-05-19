import request from '../request'
import type { UserInfo } from '@/types/user'

export function getUsersApi(params?: { page?: number; size?: number; keyword?: string }): Promise<{ list: UserInfo[]; total: number }> {
  return request.get('/users', { params })
}

export function createUserApi(data: Partial<UserInfo>): Promise<UserInfo> {
  return request.post('/users', data)
}

export function updateUserApi(id: string, data: Partial<UserInfo>): Promise<UserInfo> {
  return request.put(`/users/${id}`, data)
}

export function deleteUserApi(id: string): Promise<void> {
  return request.delete(`/users/${id}`)
}
