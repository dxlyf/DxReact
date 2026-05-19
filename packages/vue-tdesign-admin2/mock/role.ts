import type { MockMethod } from 'vite-plugin-mock'

const roles = [
  { id: '1', name: '管理员', code: 'admin', tenantId: 't1', permissions: ['*'], description: '拥有所有权限', createdAt: '2025-01-01' },
  { id: '2', name: '普通用户', code: 'user', tenantId: 't1', permissions: ['read'], description: '基础操作权限', createdAt: '2025-01-01' },
  { id: '3', name: '编辑者', code: 'editor', tenantId: 't1', permissions: ['read', 'write'], description: '可读写权限', createdAt: '2025-06-01' },
]

export default [
  {
    url: '/api/roles',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: roles, traceId: '' }),
  },
  {
    url: '/api/roles',
    method: 'post',
    response: ({ body }: any) => {
      const newRole = { id: String(roles.length + 1), ...body, createdAt: new Date().toISOString() }
      roles.push(newRole)
      return { code: 0, message: 'ok', data: newRole, traceId: '' }
    },
  },
  {
    url: '/api/roles/:id',
    method: 'put',
    response: ({ query, body }: any) => {
      const idx = roles.findIndex(r => r.id === query.id)
      if (idx === -1) return { code: 404, message: '角色不存在', data: null, traceId: '' }
      roles[idx] = { ...roles[idx], ...body }
      return { code: 0, message: 'ok', data: roles[idx], traceId: '' }
    },
  },
  {
    url: '/api/roles/:id',
    method: 'delete',
    response: ({ query }: any) => {
      const idx = roles.findIndex(r => r.id === query.id)
      if (idx === -1) return { code: 404, message: '角色不存在', data: null, traceId: '' }
      roles.splice(idx, 1)
      return { code: 0, message: 'ok', data: null, traceId: '' }
    },
  },
] as MockMethod[]
