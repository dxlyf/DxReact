import axios from 'axios'
import { getToken, clearToken } from '@/utils/token'
import router from '@/router'
import type { ApiResponse } from './types'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const tenantId = localStorage.getItem('currentTenantId')
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }

    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.code !== 0) {
      handleBusinessError(data.code)
      return Promise.reject(new Error(data.message))
    }
    return data.data
  },
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      router.push({ name: 'Login' })
    }
    if (error.response?.status === 403) {
      router.push({ name: 'Forbidden' })
    }
    if (error.response?.status === 402) {
      router.push({ name: 'SubscriptionExpired' })
    }
    return Promise.reject(error)
  },
)

function handleBusinessError(code: number) {
  if (code === 401) {
    clearToken()
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
  } else if (code === 403) {
    router.push({ name: 'Forbidden' })
  } else if (code === 402) {
    router.push({ name: 'SubscriptionExpired' })
  }
}

export default request
