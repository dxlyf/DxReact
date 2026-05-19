import request from '../request'
import type { RoleInfo } from '@/types/role'

export function getRolesApi(): Promise<RoleInfo[]> {
  return request.get('/roles')
}

export function createRoleApi(data: Partial<RoleInfo>): Promise<RoleInfo> {
  return request.post('/roles', data)
}

export function updateRoleApi(id: string, data: Partial<RoleInfo>): Promise<RoleInfo> {
  return request.put(`/roles/${id}`, data)
}

export function deleteRoleApi(id: string): Promise<void> {
  return request.delete(`/roles/${id}`)
}
