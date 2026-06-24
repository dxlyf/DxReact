import type { MockMethod } from 'vite-plugin-mock'

const users = [
  { id: '1', username: 'admin', password: 'admin',isSuperAdmin:true, nickname: '管理员', email: 'admin@example.com', role: 'tenant_admin', tenantId: 't1', permissions: ['*'] },
  { id: '2', username: 'user1', password: 'admin',isSuperAdmin:false, nickname: '用户1', email: 'user1@example.com', role: 'user', tenantId: 't1', permissions: ['read'] },
  { id: '3', username: 'user2', nickname: '用户2',isSuperAdmin:false, email: 'user2@example.com', role: 'user', tenantId: 't1', permissions: ['read', 'write'] },
]
let currentUserInfo:any=null

export default [
  {
    url: '/api/user/login',
    method: 'post',
    response: ({ query, body }: any) => {
      const user = users.find(u => u.username === body.username && u.password === body.password)
      if (!user) {
        return { code: 500, message: '用户名或密码错误', data: false }
      }
      currentUserInfo=user
      return {
        code: 0,
        message: 'ok',
        data: true,
        traceId: '',
      }
    },
  },{
    url: '/api/user/getCurrentUserInfo',
    method: 'get',
    rawResponse: (req,res) => {
      if (!currentUserInfo) {
        res.statusCode=401
        res.statusMessage='未登录'
        res.setHeader('Content-Type','application/json')
        res.write(JSON.stringify({ code: 401, message: '未登录', data: null }))
        res.end()
        return 
      }
        res.statusCode=200
        res.statusMessage='ok'
        res.setHeader('Content-Type','application/json')
        res.write(JSON.stringify({ code: 0, message: '', data: currentUserInfo }))
        res.end()
    },
  }

] as MockMethod[]
