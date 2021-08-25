import app from '@/utils/app';
import request from '@/utils/request';

export function getResouceConfig() {
  return request('baseinfo/backend/baseResource/getBaseResource', {
    method: 'POST',
  });
}
export function getCurrentUser(data: any) {
  return request('uc/backend/user/permissions', {
    skipErrorHandler: true,
    params: data,
  });
}
export function getUserList(data: any) {
  return request('users/getUserList', {
    method: 'POST',
    data,
  });
}
export function login(data: any) {
  return request('auth/sysUser/login', {
    method: 'POST',
    skipErrorHandler: true,
    data,
  });
}
export function logout() {
  return request('auth/sysUser/logout', {
    method: 'GET',
    skipErrorHandler: true,
    params: {
      token: app.getToken(),
    },
  });
}
//获取短信验证码
export function sendToSpecifiedMobile(data: any) {
  return request('uc/anon/smsCode/sendToSpecifiedMobile', {
    method: 'POST',
    skipErrorHandler: true,
    data,
  });
}

// 组织 - 查询
export function getOrgList(data) {
  return request('uc/backend/org/list', {
    method: 'POST',
    data,
  });
}
// 组织 - 根据Code查询
export function getOrgByCode(data) {
  return request('uc/backend/org/getOrgByCode', {
    method: 'GET',
    params: data,
    skipErrorHandler: true,
  });
}

// 组织 - 根据Id查询
export function getOrgById(data: any) {
  return request('uc/backend/org/getOrgById', {
    method: 'GET',
    params: data,
    skipErrorHandler: true,
  });
}
