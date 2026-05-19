import request from '../request'
import type { MenuItem } from '@/types/menu'

export function getMenusApi(tenantId: string): Promise<MenuItem[]> {
  return request.get('/menus', { params: { tenantId } })
}
