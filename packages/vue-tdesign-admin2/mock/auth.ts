import type { MockMethod } from 'vite-plugin-mock'

const tokens: Record<string, string> = {
  admin: 'mock-token-admin-xxx',
  user1: 'mock-token-user1-xxx',
}

const users = [
  {
    id: '1',
    username: 'admin',
    nickname: '超级管理员',
    avatar: '',
    email: 'admin@example.com',
    role: 'super_admin' as const,
    tenants: [
      { id: 't1', name: '租户A', code: 'tenant-a', status: 'active' as const, packageId: 'p1', expireAt: '2027-12-31', userCount: 100, createdAt: '2025-01-01' },
      { id: 't2', name: '租户B', code: 'tenant-b', status: 'active' as const, packageId: 'p2', expireAt: '2027-12-31', userCount: 50, createdAt: '2025-06-01' },
    ],
    currentTenantId: 't1',
    permissions: ['*'],
  },
  {
    id: '2',
    username: 'user1',
    nickname: '普通用户',
    avatar: '',
    email: 'user1@example.com',
    role: 'user' as const,
    tenants: [
      { id: 't1', name: '租户A', code: 'tenant-a', status: 'active' as const, packageId: 'p1', expireAt: '2027-12-31', userCount: 100, createdAt: '2025-01-01' },
    ],
    currentTenantId: 't1',
    permissions: ['read'],
  },
]

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    timeout: 500,
    response: ({ body }: { body: { username: string; password: string; tenantId?: string } }) => {
      const { username, password } = body
      if (password !== '123456') {
        return { code: 401, message: '用户名或密码错误', data: null, traceId: '' }
      }

      const token = tokens[username]
      if (!token) {
        return { code: 404, message: '用户不存在', data: null, traceId: '' }
      }

      return {
        code: 0,
        message: 'ok',
        data: {
          token,
          refreshToken: `${token}-refresh`,
          expiresIn: 7200,
        },
        traceId: '',
      }
    },
  },
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => ({ code: 0, message: 'ok', data: null, traceId: '' }),
  },
  {
    url: '/api/auth/user-info',
    method: 'get',
    response: ({ headers }: any) => {
      const authHeader = headers?.authorization || ''
      const token = authHeader.replace('Bearer ', '')

      const user = Object.values(tokens).includes(token)
        ? users.find(u => tokens[u.username] === token)
        : null

      if (!user) {
        return { code: 401, message: '未授权', data: null, traceId: '' }
      }

      return { code: 0, message: 'ok', data: user, traceId: '' }
    },
  },
] as MockMethod[]
