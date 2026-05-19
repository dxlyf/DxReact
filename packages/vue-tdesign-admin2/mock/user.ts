import type { MockMethod } from 'vite-plugin-mock'

const users = [
  { id: '1', username: 'admin', nickname: '管理员', email: 'admin@example.com', role: 'tenant_admin', tenantId: 't1', permissions: ['*'] },
  { id: '2', username: 'user1', nickname: '用户1', email: 'user1@example.com', role: 'user', tenantId: 't1', permissions: ['read'] },
  { id: '3', username: 'user2', nickname: '用户2', email: 'user2@example.com', role: 'user', tenantId: 't1', permissions: ['read', 'write'] },
]

export default [
  {
    url: '/api/users',
    method: 'get',
    response: ({ query }: any) => {
      let list = [...users]
      if (query.keyword) {
        list = list.filter(u => u.username.includes(query.keyword) || u.nickname.includes(query.keyword))
      }
      const page = Number(query.page) || 1
      const size = Number(query.size) || 10
      const start = (page - 1) * size
      return {
        code: 0,
        message: 'ok',
        data: { list: list.slice(start, start + size), total: list.length },
        traceId: '',
      }
    },
  },
  {
    url: '/api/users',
    method: 'post',
    response: ({ body }: any) => {
      const newUser = { id: String(users.length + 1), ...body, permissions: [] }
      users.push(newUser)
      return { code: 0, message: 'ok', data: newUser, traceId: '' }
    },
  },
  {
    url: '/api/users/:id',
    method: 'put',
    response: ({ query, body }: any) => {
      const idx = users.findIndex(u => u.id === query.id)
      if (idx === -1) return { code: 404, message: '用户不存在', data: null, traceId: '' }
      users[idx] = { ...users[idx], ...body }
      return { code: 0, message: 'ok', data: users[idx], traceId: '' }
    },
  },
  {
    url: '/api/users/:id',
    method: 'delete',
    response: ({ query }: any) => {
      const idx = users.findIndex(u => u.id === query.id)
      if (idx === -1) return { code: 404, message: '用户不存在', data: null, traceId: '' }
      users.splice(idx, 1)
      return { code: 0, message: 'ok', data: null, traceId: '' }
    },
  },
] as MockMethod[]
