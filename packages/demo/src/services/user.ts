import request from '@/utils/request';

export function getResouceConfig(){
   return request('baseinfo/backend/baseResource/getBaseResource',{method:"POST"})
}
export function getCurrentUser(data:any) {
  return request('uc/backend/user/permissions', {
    skipErrorHandler: true,
    params:data
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
    method: 'POST',
    skipErrorHandler: true,
  });
}
