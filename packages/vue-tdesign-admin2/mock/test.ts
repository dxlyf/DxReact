import type { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/test/timeout',
    method: 'post',
    timeout: 10000,
    rawResponse: (req, res) => {
      // 不响应，等待超时
    }
  },
  {
    url: '/api/test/slow',
    method: 'post',
    timeout: 3000,
    response: ({ body }) => {
      return {
        code: 0,
        message: '模拟慢响应（3秒延迟）',
        data: null
      }
    }
  },
  {
    url: '/api/test/500',
    method: 'post',
    statusCode: 500,
    response: ({ body }) => {
      return {
        code: 500,
        message: '服务器错误',
        data: null
      }
    }
  },
  {
    url: '/api/test/502',
    method: 'post',
    statusCode: 502,
    response: ({ body }) => {
      return {
        code: 502,
        message: '网关错误',
        data: null
      }
    }
  },
  {
    url: '/api/test/401',
    method: 'post',
    statusCode: 401,
    response: ({ body }) => {
      return {
        code: 401,
        message: '登录过期，请重新登录',
        data: null
      }
    }
  },
  {
    url: '/api/test/403',
    method: 'post',
    statusCode: 403,
    response: ({ body }) => {
      return {
        code: 403,
        message: '没有权限访问',
        data: null
      }
    }
  },
  {
    url: '/api/test/404',
    method: 'post',
    statusCode: 404,
    response: ({ body }) => {
      return {
        code: 404,
        message: '请求的资源不存在',
        data: null
      }
    }
  },
  {
    url: '/api/test/422',
    method: 'post',
    statusCode: 422,
    response: ({ body }) => {
      return {
        code: 422,
        message: '参数校验失败：邮箱格式不正确',
        data: null
      }
    }
  },
  {
    url: '/api/test/429',
    method: 'post',
    statusCode: 429,
    response: ({ body }) => {
      return {
        code: 429,
        message: '请求过于频繁，请稍后再试',
        data: null
      }
    }
  },
  {
    url: '/api/test/apierror',
    method: 'post',
    statusCode: 200,
    response: ({ body }) => {
      return {
        code: 10001,
        message: '业务逻辑错误：用户不存在',
        data: null
      }
    }
  },
  {
    url: '/api/test/random',
    method: 'post',
    response: ({ body }) => {
      const rand = Math.random()
      if (rand < 0.3) {
        return {
          code: 10001,
          message: '业务错误：参数无效',
          data: null
        }
      } else if (rand < 0.5) {
        return {
          code: 0,
          message: '成功',
          data: { id: 1, name: '测试数据' }
        }
      } else if (rand < 0.7) {
        return {
          code: 0,
          message: '成功',
          data: { id: 2, name: '另一条数据' }
        }
      } else {
        return {
          code: 10002,
          message: '服务暂不可用，请稍后重试',
          data: null
        }
      }
    }
  },
  {
    url: '/api/test/success',
    method: 'post',
    statusCode: 200,
    response: ({ body }) => {
      return {
        code: 0,
        message: '请求成功',
        data: { id: 1, name: '测试用户', email: 'test@example.com' }
      }
    }
  }
] as MockMethod[]
