import type { MockMethod } from 'vite-plugin-mock'

const tenants: Record<string, any> = {
  t1: {
    id: 't1',
    name: '租户A',
    code: 'tenant-a',
    logo: '',
    status: 'active',
    packageId: 'p1',
    expireAt: '2027-12-31',
    userCount: 100,
    createdAt: '2025-01-01',
  },
  t2: {
    id: 't2',
    name: '租户B',
    code: 'tenant-b',
    logo: '',
    status: 'active',
    packageId: 'p2',
    expireAt: '2027-12-31',
    userCount: 50,
    createdAt: '2025-06-01',
  },
}

const configs: Record<string, any> = {
  t1: {
    theme: {
      primaryColor: '#0052D9',
      primaryColorHover: '#0034B5',
      primaryColorFocus: '#0034B5',
      primaryColorActive: '#002A9A',
      logo: '',
      favicon: '',
      title: '租户A - 管理后台',
    },
    locale: 'zh-CN',
    features: ['user', 'role', 'report'],
  },
  t2: {
    theme: {
      primaryColor: '#E37318',
      primaryColorHover: '#BE5A00',
      primaryColorFocus: '#BE5A00',
      primaryColorActive: '#9A4800',
      logo: '',
      favicon: '',
      title: '租户B - 管理后台',
    },
    locale: 'zh-CN',
    features: ['user', 'role'],
  },
}

export default [
  {
    url: '/api/tenants/:id',
    method: 'get',
    response: ({ query }: any) => {
      const tenant = tenants[query.id]
      if (!tenant) return { code: 404, message: '租户不存在', data: null, traceId: '' }
      return { code: 0, message: 'ok', data: tenant, traceId: '' }
    },
  },
  {
    url: '/api/tenants/:id/config',
    method: 'get',
    response: ({ query }: any) => {
      const config = configs[query.id]
      if (!config) return { code: 404, message: '配置不存在', data: null, traceId: '' }
      return { code: 0, message: 'ok', data: config, traceId: '' }
    },
  },
  {
    url: '/api/tenants/:id/config',
    method: 'put',
    response: ({ query, body }: any) => {
      configs[query.id] = { ...configs[query.id], ...body }
      return { code: 0, message: 'ok', data: null, traceId: '' }
    },
  },
] as MockMethod[]
